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

const router = express.Router();

/**
 * no error checking is done to config so construct it very carefully.
 * @param  {Object} config
 *   {t, userId, userComment, orders([sequelize object]), type(LOAN/DISBURSE)}
 *   after successful creation of a bundle, config.result will be filled with
 *   this newBundle sequelize object. So that whoever passes in this config
 *   instance can retrieve the result.
 */
function submitCart(config) {
  const t = config.t;
  const orders = config.orders;
  const userId = config.userId;
  const type = config.type;
  return models.order_bundles.create({
    userId,
    bundleType: type,
    bundleStatus: orderENUM.PENDING,
    userComment: config.userComment,
    adminComment: null,
  }, { transaction: t }).then((newBundle) => {
    config.result = newBundle;
    return db.sequelize.Promise.each(orders, (orderToUpdate) => {
      orderToUpdate.bundleId = newBundle.id;
      orderToUpdate.orderType = type;
      orderToUpdate.orderStatus = orderENUM.PENDING;
      return orderToUpdate.save({ transaction: t }).then(() => {
        return logger.createBundleOfItem(// log the request on per-item basis
          t, orderToUpdate.userId, orderToUpdate.itemId, orderToUpdate.quantity, newBundle.id
        );
      })
    });
  }).then(() => {// log the submitted request.
    return logger.createBundle(t, userId, config.result.id);
  });
}

/**
 * no error checking is done to config so construct it very carefully.
 * @param  {Object} config
 *   {t, adminComment, fromId, toId, type(LOAN/DISBURSE) order(sequelize object)}
 *   after successful creation of a bundle, config.result will be filled with
 *   this newBundle sequelize object. So that whoever passes in this config
 *   instance can retrieve the result.
 */
function dispatch(config) {
  const order = config.order;
  const t = config.t;
  return models.order_bundles.create(
    {
      userId: config.toId,
      bundleType: config.type,
      bundleStatus: orderENUM.APPROVED,
      adminComment: config.adminComment,
    },
    { transaction: t }
  ).then((newBundle) => {
    config.result = newBundle;// fill config.result with this newBundle object
    order.bundleId = newBundle.id;
    return order.save({ transaction: t });
  }).then(() => { // log the dispatch
    return logger.dispatchBundle(t, config.fromId, config.toId, config.result.id);
  }).then(() => {
    const deductQuantityConfig = {
      userId: config.fromId,
      itemId: order.itemId,
      quantity: order.quantity,
      bundleId: config.result.id,
      t,
    };
    return orderUtils.deductQuantityAndLog(deductQuantityConfig);
  }).then(() => {
    return models.items.findOne({
      attributes: ['isAsset'],
      where: { id: order.itemId },
      transaction: t,
    });
  }).then((itemBeingDispatched) => {
    if (itemBeingDispatched.isAsset) { // asset
      const instanceIds = orderUtils.normalizeInstanceIds(config.instanceIds);
      if (instanceIds.length !== Number(order.quantity)) {
        throw new Error('Invalid asset information provided.');
      }
      const newPairs = _.map(instanceIds, (insId) => {
        return { orderId: order.id, instanceId: insId };
      });
      return models.order_instance_pairs.bulkCreate(
        newPairs, { transaction: t }
      ).then(() => {
        return models.item_instances.update(
          { instanceStatus: config.type },
          {
            where: { id: instanceIds, instanceStatus: 'AVAILABLE' },
            transaction: t,
          }
        );
      }).spread((affectedCount) => {
        if (affectedCount !== Number(instanceIds.length)) {
          throw new Error('Some asset instances chosen are not available');
        }
      });
    }
  });
}

/**
 * submit cart
 */
router.post('/:userId', function(req, res) {
  if (req.user.id != req.params.userId) {
    res.status(401).json(rb.unauthorized('Cannot submit cart for someone else.'));
  } else if (req.body.userComment == null) {
    res.status(400).json(
      rb.failure('Must provide a userComment')
    );
  } else if ((req.body.type != orderENUM.LOAN) && (req.body.type != orderENUM.DISBURSE)) {
    res.status(400).json(
      rb.failure('Must provide a type(LOAN or DISBURSE)')
    );
  } else {
    let submitCartConfig;
    db.sequelize.transaction(function(t) {
      return models.orders.findAll({
        where: {userId: req.params.userId, orderStatus: orderENUM.CARTED},
        transaction: t
      }).then(function(cartedOrders) {
        if (cartedOrders && cartedOrders.length > 0) {
          submitCartConfig = {
            t: t,
            userId: req.params.userId,
            userComment: req.body.userComment,
            orders: cartedOrders,
            type: req.body.type
          };
          return submitCart(submitCartConfig);
        }
      });
    }).then(() => { // committed
      let data;
      if (submitCartConfig) {
        data = submitCartConfig.result;
        orderEmail.createBundle(submitCartConfig.userId, submitCartConfig.result.id);
      }
      res.json(rb.success(data));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
});

/**
 * add to cart for user, or dispatch for admin/manager
 */
router.post('/:itemId/:quantity/:userId', (req, res) => {
  function processAddToCart() {
    let responseOrder;
    db.sequelize.transaction((t) => {
      return models.orders.findAll({
        where: { userId: req.params.userId, orderStatus: orderENUM.CARTED },
        transaction: t,
      }).then((cartedOrders) => {
        let existingCartedOrder;
        _.each(cartedOrders, (co) => {
          if (co.itemId == req.params.itemId) {
            existingCartedOrder = co;
          }
        });
        if (existingCartedOrder) {
          existingCartedOrder.quantity =
            Number(existingCartedOrder.quantity) + Number(req.params.quantity);
          responseOrder = existingCartedOrder;
          return existingCartedOrder.save({ transaction: t });
        }
        return models.orders.create({
          userId: req.params.userId,
          itemId: req.params.itemId,
          quantity: req.params.quantity,
          orderStatus: orderENUM.CARTED,
          userComment: null,
          adminComment: null,
        }, { transaction: t }).then((newCartedOrder) => {
          responseOrder = newCartedOrder;
        });
      });
    }).then(() => { // committed
      res.json(rb.success(responseOrder));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
  function processDispatch() {
    let dispatchConfig;
    db.sequelize.transaction((t) => {
      return models.orders.create({
        userId: req.params.userId,
        itemId: req.params.itemId,
        quantity: req.params.quantity,
        orderType: req.body.type,
        orderStatus: orderENUM.APPROVED,
      }, { transaction: t }).then((newOrder) => {
        dispatchConfig = {
          fromId: req.user.id,
          toId: req.params.userId,
          order: newOrder,
          type: req.body.type,
          adminComment: req.body.adminComment,
          instanceIds: req.body.instanceIds,
          t,
        };
        return dispatch(dispatchConfig);
      });
    }).then(() => { // committed
      orderEmail.dispatchBundle(dispatchConfig.result.userId, dispatchConfig.result.id);
      res.json(rb.success(dispatchConfig.result));
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
  function onManager() {
    if (req.body.orderStatus === orderENUM.CARTED) {
      if (req.user.id != req.params.userId) {
        res.status(401).json(
          rb.unauthorized('You cannot add to another user\'s cart!')
        );
      } else {
        processAddToCart();
      }
    } else if (req.body.orderStatus === orderENUM.DISPATCHED) {
      if ((req.body.type !== orderENUM.LOAN) && (req.body.type !== orderENUM.DISBURSE)) {
        res.status(400).json(
          rb.failure('Must provide a type(LOAN or DISBURSE)')
        );
      } else {
        processDispatch();
      }
    } else {
      res.status(400).json(
        rb.failure('Must provide an orderStatus, CARTED or DISPATCHED')
      );
    }
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    if (req.params.userId != req.user.id) { // normal can only create order for themselves
      res.status(401).json(rb.unauthorized());
    } else if (req.body.orderStatus !== orderENUM.CARTED) {
      res.status(400).json(
        rb.failure('Must provide an orderStatus as CARTED')
      );
    } else {
      processAddToCart();
    }
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
