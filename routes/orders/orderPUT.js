const express = require('express');
const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const rb = require('../utils/resBuilder');
const pc = require('../utils/permissionChecker');
const logger = require('./orderLogger');
const orderENUM = require('./orderENUM');
const orderUtils = require('./orderUtils');
const orderEmail = require('./orderEmails');
const thresholdChecker = require('../utils/checkThreshold');

const router = express.Router();

// =========================================================================
// Approve/Deny a bundle
// =========================================================================
/**
 * @param  {Object} config
 *   {
 *     userId (the userId of the user who proccesses this bundle)
 *     bundleToUpdate(sequelize instance, with changes made but not saved)
 *     bundleType (DISBURSE or LOAN, indicating the approval type)
 *     adminComment (String)
 *     isApproved (Boolean)
 *     instanceMap { orderId -> instanceIds } pairs to support asset.
 *     res (res object as in function(req, res, next))
 *   }
 */
function approveOrDenyBundle(config) {
  const userId = config.userId;
  const bundleToUpdate = config.bundleToUpdate;
  const bundleType = config.bundleType;
  const isApproved = config.isApproved;
  const adminComment = config.adminComment;
  const instanceMap = orderUtils.normalizeInstanceMap(config.instanceMap);
  const res = config.res;
  db.sequelize.transaction((t) => {
    if (isApproved) { bundleToUpdate.bundleType = bundleType; }
    if (adminComment) { bundleToUpdate.adminComment = adminComment; }
    bundleToUpdate.bundleStatus = isApproved ? orderENUM.APPROVED : orderENUM.DENIED;
    return bundleToUpdate.save( // first, update the bundle
      { transaction: t }
    ).then(() => { // second, find all the orders belonging to this bundle
      return models.orders.findAll({ where: { bundleId: bundleToUpdate.id } });
    }).then((ordersFound) => { // third, bulk update all these orders
      return db.sequelize.Promise.each(ordersFound, (orderToUpdate) => {
        orderToUpdate.orderType = bundleToUpdate.bundleType;
        orderToUpdate.orderStatus =
          isApproved ? orderENUM.APPROVED : orderENUM.DENIED;
        return orderToUpdate.save(
          { transaction: t }
        ).then(() => {
          if (isApproved) {
            const deductQuantityConfig = {
              t,
              userId,
              itemId: orderToUpdate.itemId,
              quantity: orderToUpdate.quantity,
              bundleId: bundleToUpdate.id,
            };
            return orderUtils.deductQuantityAndLog(deductQuantityConfig);
          }
        }).then(() => {
          if (isApproved) {
            return models.items.findOne({
              attributes: ['id', 'name', 'isAsset'],
              where: { id: orderToUpdate.itemId },
              transaction: t,
            }).then((itemAssociated) => {
              if (!itemAssociated.isAsset) {
                return;
              }
              if (
                !Array.isArray(instanceMap[orderToUpdate.id])
                || instanceMap[orderToUpdate.id].length !== Number(orderToUpdate.quantity)
              ) { // asset, sanity check first.
                throw new Error(`Invalid asset information provided for orderId ${orderToUpdate.id}`);
              } else { // process asset.
                const instanceIds = instanceMap[orderToUpdate.id];
                const newPairs = _.map(instanceIds, (insId) => {
                  return { orderId: orderToUpdate.id, instanceId: insId };
                });
                return models.order_instance_pairs.bulkCreate(
                  newPairs, { transaction: t }
                ).then(() => {
                  return models.item_instances.update(
                    { instanceStatus: bundleType },
                    {
                      where: { id: instanceIds, instanceStatus: 'AVAILABLE' },
                      transaction: t,
                    }
                  );
                }).spread((affectedCount) => {
                  if (affectedCount !== Number(instanceIds.length)) {
                    throw new Error(`Some asset instances chosen for orderId ${orderToUpdate.id} are not available`);
                  }
                });
              }
            });
          }
        });
      });
    }).then(() => { // lastly, log the approval/denial
      if (isApproved) {
        return logger.approveBundle(
          t, userId, bundleToUpdate.userId, bundleToUpdate.id
        );
      } else {
        return logger.denyBundle(
          t, userId, bundleToUpdate.userId, bundleToUpdate.id
        );
      }
    });
  }).then(() => { // committed
    if (isApproved) {
      thresholdChecker.checkThresholds({ bundleId: bundleToUpdate.id });
      orderEmail.approveBundle(bundleToUpdate.userId, bundleToUpdate.id);
    } else {
      orderEmail.denyBundle(bundleToUpdate.userId, bundleToUpdate.id);
    }
    res.json(rb.success(bundleToUpdate));
  }).catch((error) => {
    res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
  });
}

/**
 * Approve/Deny a bundle
 */
router.put('/:bundleId', (req, res) => {
  const bundleId = req.params.bundleId;
  const bundleType = req.body.type;
  const bundleStatus = req.body.bundleStatus;
  const adminComment = req.body.adminComment;
  const instanceMap = req.body.instanceMap;
  function onManager() {
    models.order_bundles.findById(bundleId).then((bundleToUpdate) => {
      if (
        !bundleToUpdate || bundleToUpdate.bundleStatus !== orderENUM.PENDING
      ) {
        res.status(400).json(rb.failure(
          'No such bundle or bundle is not pending',
          rb.ERROR.CAN_NOT_UPDATE_REQUEST
        ));
      } else if (
        bundleStatus !== orderENUM.APPROVED && bundleStatus !== orderENUM.DENIED
      ) {
        res.status(400).json(rb.failure(
          'bundleStatus can only be either APPROVED or DENIED when updating',
          rb.ERROR.CAN_NOT_UPDATE_REQUEST
        ));
      } else if (
        bundleStatus === orderENUM.APPROVED &&
        (bundleType !== orderENUM.LOAN && bundleType !== orderENUM.DISBURSE)
      ) {
        res.status(400).json(rb.failure(
          'type can only be either LOAN or DISBURSE when approving',
          rb.ERROR.CAN_NOT_UPDATE_REQUEST
        ));
      } else {
        const updateConfig = {
          userId: req.user.id,
          bundleToUpdate,
          isApproved: (bundleStatus === orderENUM.APPROVED),
          adminComment,
          bundleType,
          instanceMap,
          res,
        };
        approveOrDenyBundle(updateConfig);
      }
    });
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.status(401).json(rb.unauthorized('Normal user cannot update a bundle'));
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});


// =========================================================================
// Convert a LOAN to DISBURSE
// or RETURN a loan.
// =========================================================================
/**
 * check whether a bundle or order is valid to be returned or converted to disbursement
 * @param  {Object}  candidate either a bundle or an order sequelize object.
 * @return {Boolean} true if valid, false otherwise.
 */
function isValidToReturnOrConvert(candidate) {
  let type;
  let status;
  if (candidate.orderType && candidate.orderStatus) { // it's an order
    type = 'orderType';
    status = 'orderStatus';
  } else if (candidate.bundleType && candidate.bundleStatus) { // it's a bundle
    type = 'bundleType';
    status = 'bundleStatus';
  } else {
    return false;
  }
  return (
    candidate[type] === orderENUM.LOAN && // first, it needs to be a loan.
    ( // second, it must be approved or dispatched.
      candidate[status] === orderENUM.DISPATCHED ||
      candidate[status] === orderENUM.APPROVED
    )
  );
}

function updateBundleAfterOrderUpdate(config) {
  const ordersFound = config.ordersFound;
  const t = config.t;
  let numConverted = 0;
  let numReturned = 0;
  _.each(ordersFound, (o) => {
    if (o.orderType == orderENUM.DISBURSE) {
      numConverted += 1;
    } else if (o.orderStatus == orderENUM.RETURNED) {
      numReturned += 1;
    }
  });
  if (numConverted == ordersFound.length) {
    // all conveted, mark the bundle as converted.
    return models.order_bundles.update(
      { bundleType: orderENUM.DISBURSE },
      { where: { id: config.order.bundleId } },
      { transaction: t }
    );
  } else if ((numConverted + numReturned) == ordersFound.length) {
    // all converted or returned, mark the bundle as returned.
    return models.order_bundles.update(
      { bundleStatus: orderENUM.RETURNED },
      { where: { id: config.order.bundleId } },
      { transaction: t }
    );
  }
}

/**
 * Return a LOAN bundle or order.
 * @param  {object} config {bundle/order (sequelize object), userId(performer), res}
 */
function returnLoan(config) {
  const userId = config.userId;
  const res = config.res;
  function returnIndividualOrder(orderToReturn, t) {
    if (isValidToReturnOrConvert(orderToReturn)) {
      orderToReturn.orderStatus = orderENUM.RETURNED;
      return orderToReturn.save({ transaction: t }).then(() => {
        // if this order has some pending backfills, this operation essentially
        // denies all of the pending backfills.
        return models.backfill_proofs.update(
          { backfillStatus: orderENUM.DENIED },
          {
            where: { orderId: orderToReturn.id, backfillStatus: orderENUM.PENDING },
            transaction: t,
          }
        );
      }).then(() => {
        const addQuantityConfig = {
          userId,
          itemId: orderToReturn.itemId,
          quantity: orderToReturn.quantity,
          bundleId: orderToReturn.bundleId,
          t,
        };
        return orderUtils.addQuantityAndLog(addQuantityConfig);
      }).then(() => {
        // check whether if it's an asset. If it is, mark all the associated
        // instances to be DISBURSE as well.
        return models.order_instance_pairs.findAll({
          where: { orderId: orderToReturn.id },
          transaction: t,
        });
      }).then((orderInsPairs) => {
        if (orderInsPairs.length > 0) { // asset
          const instanceIds = _.map(orderInsPairs, 'instanceId');
          return models.item_instances.update(
            { instanceStatus: 'AVAILABLE' },
            { where: { id: instanceIds }, transaction: t }
          );
        }
      });
    }
  }
  if (config.bundle) { // return an entire bundle
    db.sequelize.transaction((t) => {
      config.bundle.bundleStatus = orderENUM.RETURNED;
      return config.bundle.save({
        transaction: t,
      }).then(() => {
        return logger.returnLoanBundle(t, userId, config.bundle.id);
      }).then(() => {
        return models.orders.findAll(
          { where: { bundleId: config.bundle.id }, transaction: t }
        );
      }).then((ordersFound) => { // bulk return orders belonging to the bundle.
        return db.sequelize.Promise.each(ordersFound, (orderToReturn) => {
          return returnIndividualOrder(orderToReturn, t);
        });
      });
    }).then(() => { // committed
      orderEmail.returnLoanBundle(config.bundle.userId, config.bundle.id);
      res.json(rb.success(config.bundle));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  } else { // return an order
    db.sequelize.transaction((t) => {
      return returnIndividualOrder(config.order, t).then(() => {
        if (config.order.orderStatus === orderENUM.RETURNED) {
          // Now we check if ALL the orders in the bundle are returned.
          // if they are, go ahead and mark the bundle as returned as well.
          return models.orders.findAll(
            { where: { bundleId: config.order.bundleId }, transaction: t }
          );
        }
      }).then((ordersFound) => {
        const updateBundleConfig = {
          order: config.order,
          ordersFound,
          t,
        };
        return updateBundleAfterOrderUpdate(updateBundleConfig);
      });
    }).then(() => { // committed
      orderEmail.returnLoanOrder(config.order.userId, config.order.bundleId);
      res.json(rb.success(config.order));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
}

/**
 * Convert a LOAN bundle or order to DISBURSE
 * @param  {object} config {bundle/order (sequelize object), userId(performer), res}
 */
function convertLoan(config) {
  const userId = config.userId;
  const res = config.res;
  function convertIndividualOrder(orderToConvert, t) {
    if (isValidToReturnOrConvert(orderToConvert)) {
      orderToConvert.orderType = orderENUM.DISBURSE;
      return orderToConvert.save({ transaction: t }).then(() => {
        return logger.convertLoanOrderToDisburse(
          t, userId, orderToConvert.itemId, orderToConvert.quantity, orderToConvert.bundleId
        );
      }).then(() => {
        // if this order has some pending backfills, this operation essentially
        // denies all of the pending backfills.
        return models.backfill_proofs.update(
          { backfillStatus: orderENUM.DENIED },
          {
            where: { orderId: orderToConvert.id, backfillStatus: orderENUM.PENDING },
            transaction: t,
          }
        );
      }).then(() => {
        // check whether if it's an asset. If it is, mark all the associated
        // instances to be DISBURSE as well.
        return models.order_instance_pairs.findAll({
          where: { orderId: orderToConvert.id },
          transaction: t,
        });
      }).then((orderInsPairs) => {
        if (orderInsPairs.length > 0) {
          const instanceIds = _.map(orderInsPairs, 'instanceId');
          return models.item_instances.update(
            { instanceStatus: orderENUM.DISBURSE },
            { where: { id: instanceIds }, transaction: t }
          );
        }
      });
    }
  }
  if (config.bundle) { // convert an entire bundle
    db.sequelize.transaction((t) => {
      config.bundle.bundleType = orderENUM.DISBURSE;
      return config.bundle.save({
        transaction: t
      }).then(() => {
        return logger.convertLoanBundleToDisburse(t, userId, config.bundle.id);
      }).then(() => {
        return models.orders.findAll({
          where: { bundleId: config.bundle.id },
          transaction: t
        });
      }).then((ordersFound) => { // bulk convert orders belonging to the bundle.
        return db.sequelize.Promise.each(ordersFound, (orderToConvert) => {
          return convertIndividualOrder(orderToConvert, t);
        });
      });
    }).then(() => { // committed
      thresholdChecker.checkThresholds({ bundleId: config.bundle.id });
      orderEmail.convertLoanBundleToDisburse(config.bundle.userId, config.bundle.id);
      res.json(rb.success(config.bundle));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  } else { // convert an order
    db.sequelize.transaction((t) => {
      return convertIndividualOrder(config.order, t).then(() => {
        if (config.order.orderType === orderENUM.DISBURSE) {
          // Now we check if ALL the orders in the bundle are converted.
          // if they are, go ahead and mark the bundle as converted as well.
          return models.orders.findAll(
            { where: { bundleId: config.order.bundleId }, transaction: t }
          );
        }
      }).then((ordersFound) => {
        const updateBundleConfig = {
          order: config.order,
          ordersFound,
          t,
        };
        return updateBundleAfterOrderUpdate(updateBundleConfig);
      });
    }).then(() => { // committed
      thresholdChecker.checkThresholds({ itemIds: [config.order.itemId] });
      orderEmail.convertLoanOrderToDisburse(config.order.userId, config.order.bundleId);
      res.json(rb.success(config.order));
    }).catch((error) => { // aborted
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
}

/**
 * Convert a LOAN to DISBURSE
 * or RETURN a loan.
 */
router.put('/:id/:type', (req, res) => {
  function onManager() {
    const id = req.params.id;
    const type = req.params.type;
    function getOrderThen(functionToCall) {
      models.orders.findById(id).then((order) => {
        if (!order || !isValidToReturnOrConvert(order)) {
          res.status(400).json(rb.failure(
            'No such order, or order is not a loan, or it is not approved nor dispatched',
            rb.ERROR.CAN_NOT_UPDATE_REQUEST
          ));
        } else { // ok to return this order.
          functionToCall({ userId: req.user.id, order, res });
        }
      });
    }
    function getBundleThen(functionToCall) {
      models.order_bundles.findById(id).then((bundle) => {
        if (!bundle || !isValidToReturnOrConvert(bundle)) {
          res.status(400).json(rb.failure(
            'No such bundle, or bundle is not a loan, or it is not approved nor dispatched',
            rb.ERROR.CAN_NOT_UPDATE_REQUEST
          ));
        } else { // ok to return this bundle.
          functionToCall({ userId: req.user.id, bundle, res });
        }
      });
    }
    let functionToCall;
    if (req.body.isReturn) {
      functionToCall = returnLoan;
    } else if (req.body.isConvert) {
      functionToCall = convertLoan;
    } else {
      res.status(400).json(rb.failure(
        'Must provide isReturn or isConvert',
        rb.ERROR.CAN_NOT_UPDATE_REQUEST
      ));
    }
    if (type === 'ORDER') {
      getOrderThen(functionToCall);
    } else if (type === 'BUNDLE') {
      getBundleThen(functionToCall);
    } else {
      res.status(400).json(rb.failure(
        'type in the path must be ORDER or BUNDLE',
        rb.ERROR.CAN_NOT_UPDATE_REQUEST
      ));
    }
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.status(401).json(rb.unauthorized('Normal user cannot update a bundle'));
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
