const express = require('express');
const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const rb = require('../utils/resBuilder');
const pc = require('../utils/permissionChecker');
const logger = require('../orders/orderLogger');
const orderENUM = require('../orders/orderENUM');
const orderUtils = require('../orders/orderUtils');
const orderEmail = require('../orders/orderEmails');

const router = express.Router();

function hasExistingProofs(existingProofs) {
  return existingProofs && existingProofs.length > 0;
}

function getExistingBackfillStatus(existingProofs) {
  return existingProofs[0].backfillStatus;
}

// If an order does not have an existing backfill (most common case)
// or the existing backfills all have PENDING backfillStatus,
// a new row will be created with backfillStatus = PENDING.
// Invalid if this order does not have LOAN orderType or APPROVED orderStatus
function isValidForNewBackfill(config) {
  const orderToBackfill = config.orderToBackfill;
  const existingProofs = config.existingProofs;
  if (
    orderToBackfill.orderType !== orderENUM.LOAN
    || orderToBackfill.orderStatus !== orderENUM.APPROVED
  ) {
    return false;
  }
  return (
    !hasExistingProofs(existingProofs)
    || getExistingBackfillStatus(existingProofs) === orderENUM.PENDING
  );
}

// If an order is already approved for backfill,
// new rows, since they are just additional proofs,
// will be created with backfillStatus = APPROVED.
// Invalid if this order does not have DISBURSE orderType or APPROVED orderStatus
function isAlreadyApproved(config) {
  const orderToBackfill = config.orderToBackfill;
  const existingProofs = config.existingProofs;
  if (
    orderToBackfill.orderType !== orderENUM.DISBURSE
    || orderToBackfill.orderStatus !== orderENUM.APPROVED
  ) {
    return false;
  }
  return (
    hasExistingProofs(existingProofs)
    && getExistingBackfillStatus(existingProofs) === orderENUM.APPROVED
  );
}

// If an order is already denied for backfill,
// all the existing backfills
// as well as the newly created proof will be changed to PENDING.
// (It essentially triggers the backfill request again).
// Invalid if this order does not have LOAN orderType or APPROVED orderStatus
function isAlreadyDenied(config) {
  const orderToBackfill = config.orderToBackfill;
  const existingProofs = config.existingProofs;
  if (
    orderToBackfill.orderType !== orderENUM.LOAN
    || orderToBackfill.orderStatus !== orderENUM.APPROVED
  ) {
    return false;
  }
  return (
    hasExistingProofs(existingProofs)
    && getExistingBackfillStatus(existingProofs) === orderENUM.DENIED
  );
}

function abort(msg) {
  throw new Error(msg);
}

router.post('/', (req, res) => {
  const fileHandle = req.body.fileHandle;
  const fileName = req.body.fileName;
  const orderIds = orderUtils.normalizeOrderIds(req.body.orderIds);
  if (!fileHandle) {
    res.status(400).json(rb.failure('Must provide a valid fileHandle'));
    return;
  }
  if (!fileName) {
    res.status(400).json(rb.failure('Must provide a valid fileName'));
    return;
  }
  if (orderIds.length < 1) {
    res.status(400).json(rb.failure('Must provide a non-empty array of orderIds'));
    return;
  }
  const bundleIdsInvolved = []; // ideally there is only one bundleId, but just in case.
  db.sequelize.transaction((t) => {
    let ordersFound;
    return models.orders.findAll({
      where: { id: orderIds },
      transaction: t,
    }).then((orders) => {
      ordersFound = orders;
      return models.backfill_proofs.findAll({
        where: { orderId: orderIds },
        transaction: t,
      });
    }).then((proofs) => {
      const proofsByOrderId = _.groupBy(proofs, 'orderId');
      return db.sequelize.Promise.each(ordersFound, (orderToBackfill) => {
        if (orderToBackfill.userId != req.user.id) {
          abort(`No permission to modify order ${orderToBackfill.id}`);
        }
        bundleIdsInvolved.push(orderToBackfill.bundleId);
        const existingProofs = proofsByOrderId[orderToBackfill.id];
        console.log(existingProofs);
        const params = { orderToBackfill, existingProofs };
        const newProof = {
          orderId: orderToBackfill.id,
          fileName,
          fileHandle,
        };
        if (isValidForNewBackfill(params)) {
          newProof.backfillStatus = orderENUM.PENDING;
          return models.backfill_proofs.create(
            newProof,
            { transaction: t }
          );
        } else if (isAlreadyApproved(params)) {
          newProof.backfillStatus = orderENUM.APPROVED;
          return models.backfill_proofs.create(
            newProof,
            { transaction: t }
          );
        } else if (isAlreadyDenied(params)) {
          const existingProofIds = _.map(existingProofs, 'id');
          return models.backfill_proofs.update(
            { backfillStatus: orderENUM.PENDING },
            {
              where: { id: existingProofIds },
              transaction: t,
            }
          ).then(() => {
            newProof.backfillStatus = orderENUM.PENDING;
            return models.backfill_proofs.create(
              newProof,
              { transaction: t }
            );
          });
        } else {
          abort(`Cannot submit proof for order ${orderToBackfill.id}`);
        }
      });
    }).then(() => {
      const bundleIds = _.uniq(bundleIdsInvolved);
      return db.sequelize.Promise.each(bundleIds, (bundleId) => {
        return logger.submitBackfill(t, req.user.id, bundleId);
      });
    });
  }).then(() => { // committed
    const bundleIds = _.uniq(bundleIdsInvolved);
    _.each(bundleIds, (bundleId) => {
      orderEmail.submitBackfill(req.user.id, bundleId);
    });
    res.json(rb.success());
  }).catch((error) => {
    res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
  });
});

router.put('/:orderId', (req, res) => {
  function onManager() {
    const backfillStatus = req.body.backfillStatus;
    const orderId = req.params.orderId;
    if (backfillStatus !== orderENUM.APPROVED && backfillStatus !== orderENUM.DENIED) {
      res.status(401).json(rb.failure('backfillStatus should be either APPROVED or DENIED'));
      return;
    }
    if (!orderId && orderId !== 0) {
      res.status(401).json(rb.failure('Must provide a valid orderId'));
    }
    let orderFound;
    const isApproved = backfillStatus === orderENUM.APPROVED;
    db.sequelize.transaction((t) => {
      return models.orders.findOne({
        where: { id: orderId },
        transaction: t,
      }).then((o) => {
        if (!o || o.orderType !== orderENUM.LOAN || o.orderStatus !== orderENUM.APPROVED) {
          abort(`Invalid order ${orderId}`);
        }
        orderFound = o;
        return models.backfill_proofs.update(
          { backfillStatus },
          {
            where: { orderId },
            transaction: t,
          }
        );
      }).spread((affectedCount) => {
        if (affectedCount < 1) {
          abort(`No backfill request found for order ${orderId}.`);
        }
        if (!isApproved) {
          return logger.denyBackfill(
            t, req.user.id, orderFound.itemId, orderFound.quantity, orderFound.bundleId
          );
        } else {
          return logger.approveBackfill(
            t, req.user.id, orderFound.itemId, orderFound.quantity, orderFound.bundleId
          );
        }
      })
    }).then(() => { // committed
      if (isApproved) {
        orderEmail.approveBackfill(orderFound.userId, orderFound.bundleId);
      } else {
        orderEmail.denyBackfill(orderFound.userId, orderFound.bundleId);
      }
      res.json(rb.success());
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.status(400).json(rb.unauthorized('Normal users cannot process backfill requests'));
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

router.delete('/:proofId', (req, res) => {
  const proofId = req.params.proofId;
  let orderFound;
  let proofFound;
  db.sequelize.transaction((t) => {
    return models.backfill_proofs.findOne({
      where: { id: proofId },
      transaction: t,
    }).then((proof) => {
      if (!proof) {
        abort('Error removing proof');
      }
      proofFound = proof;
      return models.orders.findOne({
        where: { id: proof.orderId },
        transaction: t,
      });
    }).then((order) => {
      if (!order) {
        abort('Proof is not associated with a valid order');
      }
      if (order.userId != req.user.id) {
        abort('No permission to remove this proof');
      }
      orderFound = order;
      return proofFound.destroy({ transaction: t });
    });
  }).then(() => { // committed
    orderEmail.removeBackfill(orderFound.userId, orderFound.bundleId);
    res.json(rb.success());
  }).catch((error) => {
    res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
  });
});

module.exports = router;
