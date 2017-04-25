const express = require('express');
const router = express.Router();
const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const rb = require('../utils/resBuilder');
const pc = require('../utils/permissionChecker');
const queryBuilder = require('../utils/queryBuilder');
const logger = require('./orderLogger');
const orderENUM = require('./orderENUM');
const orderUtils = require('./orderUtils');

/**
 * Get all bundles with filter
 */
router.get('/', (req, res) => {
  const targetBundleIds = req.query.bundleIds;
  const userIds = req.query.userIds;
  const itemIds = req.query.itemIds;
  const types = req.query.types;
  const statuses = req.query.statuses;
  const filterByEitherUserIdsOrItemIds = req.query.filterByEitherUserIdsOrItemIds;
  // Yes it's a hack. Usually, if userIds and itemIds are both present, we will
  // find the orders that meet both id requirements. But when this
  // filterByEitherUserIdsOrItemIds field is present, we will include the
  // orders that meet only one of the id requirement. It's ugly but it saves
  // tons of time to build another api.

  function getAllBundlesWithIds(bundleIds) {
    const query = { where: {} };
    if (bundleIds) { query.where.id = bundleIds; }
    if (types) { query.where.bundleType = types; }
    queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
    queryBuilder.orderByCreatedAt(query);
    models.order_bundles.findAll(query).then((rawBundleObjects) => {
      const rawBundles = _.map(rawBundleObjects, 'dataValues');
      const bundleIdsFound = _.map(rawBundles, 'id');
      models.orders.findAll({
        attributes: ['id', 'bundleId'],
        where: { bundleId: bundleIdsFound },
      }).then((ordersFound) => {
        const orderIdsFound = _.map(ordersFound, 'id');
        const bundleIdToOrders = _.groupBy(ordersFound, 'bundleId');
        models.backfill_proofs.findAll({
          where: { orderId: orderIdsFound },
        }).then((proofsFound) => {
          const orderIdToProofs = _.groupBy(proofsFound, 'orderId');
          _.each(rawBundles, (rawBundle) => {
            let pendingCount = 0;
            let approvedCount = 0;
            let deniedCount = 0;
            _.each(bundleIdToOrders[rawBundle.id], (o) => {
              // for each order within this bundle, see if it has backfills.
              if (orderIdToProofs[o.id] && orderIdToProofs[o.id].length > 0) {
                switch (orderIdToProofs[o.id][0].backfillStatus) {
                  case orderENUM.PENDING:
                    pendingCount += 1;
                    break;
                  case orderENUM.APPROVED:
                    approvedCount += 1;
                    break;
                  case orderENUM.DENIED:
                    deniedCount += 1;
                    break;
                  default:
                    break;
                }
              }
            });
            if (pendingCount > 0) {
              rawBundle.backfillStatus = orderENUM.PENDING;
            } else if (approvedCount > 0 && deniedCount > 0) {
              rawBundle.backfillStatus = orderENUM.PARTIALLY_APPROVED;
            } else if (approvedCount > 0) {
              rawBundle.backfillStatus = orderENUM.APPROVED;
            } else if (deniedCount > 0) {
              rawBundle.backfillStatus = orderENUM.DENIED;
            }
          });
          orderUtils.fillUserNamesForRawBundles({ rawBundles }, (resultBundles) => {
            res.json(rb.success(resultBundles));
          });
        });
      });
    });
  }
  function getAllOrdersUsingFilter() {
    if (targetBundleIds) {
      getAllBundlesWithIds(targetBundleIds);
    } else if (userIds || itemIds || statuses) {
      const query = {
        attributes: ['bundleId'],
        where: {},
      };
      if (filterByEitherUserIdsOrItemIds && userIds && itemIds) {
        query.where.$or = [{ userId: userIds }, { itemId: itemIds }];
      } else {
        if (userIds) { query.where.userId = userIds; }
        if (itemIds) { query.where.itemId = itemIds; }
      }
      if (statuses) query.where.orderStatus = statuses;
      models.orders.findAll(query).then((ordersFound) => {
        const bundleIds = _.uniq(_.map(ordersFound, 'bundleId'));
        getAllBundlesWithIds(bundleIds);
      });
    } else { // no query params
      getAllBundlesWithIds();
    }
  }
  function onAdmin() { // admin can query for anything
    getAllOrdersUsingFilter();
  }
  function onManager() { // manager can query for anything
    getAllOrdersUsingFilter();
  }
  function onUser() { // user can only query themselves
    if (!userIds || userIds != req.user.id) {
      res.status(401).json(rb.unauthorized());
    } else {
      getAllOrdersUsingFilter();
    }
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

/**
 * Get all carted orders of a user.
 */
router.get('/cart/:userId', (req, res) => {
  const userId = req.params.userId;
  if (userId != req.user.id) {
    res.status(401).json(
      rb.unauthorized('Users can only get their own carts!')
    );
  } else {
    models.orders.findAll({
      order: [['createdAt', 'DESC']],
      where: { userId, orderStatus: orderENUM.CARTED }
    }).then((rawOrders) => {
      orderUtils.fillNamesForRawOrders({ rawOrders }, (resultOrders) => {
        res.json(rb.success(resultOrders));
      });
    });
  }
});

/**
 * Get all orders within a bundle.
 */
router.get('/:bundleId', (req, res) => {
  const bundleId = req.params.bundleId;
  function onManager() {
    models.order_bundles.findById(bundleId).then((bundle) => {
      if (!bundle) {
        res.json(rb.success([]));
      } else {
        models.orders.findAll({
          order: [['createdAt', 'ASC']],
          where: { bundleId },
        }).then((rawOrderObjects) => {
          const rawOrders = _.map(rawOrderObjects, 'dataValues');
          orderUtils.fillBackfillInfoForRawOrders({ rawOrders }, (ordersWithoutNames) => {
            orderUtils.fillNamesForRawOrders({ rawOrders: ordersWithoutNames }, (resultOrders) => {
              res.json(rb.success(resultOrders));
            });
          });
        });
      }
    });
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    models.order_bundles.findById(bundleId).then((bundle) => {
      if (!bundle || bundle.userId != req.user.id) {
        res.status(401).json(
          rb.unauthorized('Normal user cannot get others\' bundles')
        );
      } else {
        onManager();
      }
    })
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
