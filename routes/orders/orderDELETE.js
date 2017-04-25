const express = require('express');
const router = express.Router();
const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const rb = require('../utils/resBuilder');
const pc = require('../utils/permissionChecker');
const logger = require('./orderLogger');
const orderENUM = require('./orderENUM');
const orderUtils = require('./orderUtils');
const orderEmail = require('./orderEmails');

/**
 * All users (including admin and manager) can only delete
 * their own PENDING bundle or CARTED order.
 */
router.delete('/:id/:type', (req, res) => {
  if (req.params.type === 'ORDER') {
    const orderId = req.params.id;
    models.orders.findById(orderId).then((order) => {
      if (
        !order || order.orderStatus !== orderENUM.CARTED || order.userId != req.user.id
      ) {
        res.status(400).json(
          rb.failure('Can\'t delete this order', rb.ERROR.CAN_NOT_DELETE_REQUEST)
        );
      } else {
        order.destroy().then(() => {
          res.json(rb.success());
        });
      }
    });
  } else if (req.params.type === 'BUNDLE'){
    const bundleId = req.params.id;
    db.sequelize.transaction((t) => {
      return models.order_bundles.findOne({
        where: { id: bundleId },
        transaction: t
      }).then((bundle) => {
        if (
          !bundle || bundle.bundleStatus !== orderENUM.PENDING
          || bundle.userId != req.user.id
        ) {
          throw new Error('Cannot delete requests made by others'); // force the transaction to abort.
        } else {
          return bundle.destroy({ transaction: t });
        }
      }).then(() => {
        // now the bundle is destroyed, need to destroy attached orders as well.
        return models.orders.destroy(
          { where: { bundleId }, transaction: t }
        );
      }).then(() => {
        return logger.deleteBundle(t, req.user.id, bundleId);
      });
    }).then(() => { // committed
      orderEmail.deleteBundle(req.user.id, bundleId);
      res.json(rb.success());
    }).catch((error) => {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    });
  } else {
    res.status(400).json(
      rb.failure('Invalid delete type. Can only be ORDER or BUNDLE')
    );
  }
});

module.exports = router;
