const router = require('express').Router();
const _ = require('lodash');
const models = require('../../models');
const rb = require('../utils/resBuilder');
const pc = require('../utils/permissionChecker');
const queryBuilder = require('../utils/queryBuilder');
const orderENUM = require('../orders/orderENUM');
const orderUtils = require('../orders/orderUtils');

/**
 * Get all loans with filter
 */
router.get('/', (req, res) => {
  const userIds = req.query.userIds;
  const itemIds = req.query.itemIds;
  const statuses = req.query.statuses;
  const filterByEitherUserIdsOrItemIds = req.query.filterByEitherUserIdsOrItemIds;
  // Yes it's a hack. Usually, if userIds and itemIds are both present, we will
  // find the orders that meet both id requirements. But when this
  // filterByEitherUserIdsOrItemIds field is present, we will include the
  // orders that meet only one of the id requirement. It's ugly but it saves
  // tons of time to build another api.

  function getAllLoansUsingFilter() {
    const query = { where: { orderType: orderENUM.LOAN } };
    if (statuses) query.where.orderStatus = statuses;
    if (filterByEitherUserIdsOrItemIds && userIds && itemIds) {
      query.where.$or = [{ userId: userIds }, { itemId: itemIds }];
    } else {
      if (userIds) { query.where.userId = userIds; }
      if (itemIds) { query.where.itemId = itemIds; }
    }
    queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
    queryBuilder.orderByCreatedAt(query);
    models.orders.findAll(query).then((rawOrders) => {
      orderUtils.fillBackfillInfoForRawOrders({ rawOrders }, (ordersWithoutNames) => {
        orderUtils.fillNamesForRawOrders({ rawOrders: ordersWithoutNames }, (ordersWithoutComments) => {
          orderUtils.fillCommentsForRawOrders({ rawOrders: ordersWithoutComments }, (resultOrders) => {
            res.json(rb.success(resultOrders));
          });
        });
      });
    });
  }
  function onManager() { // manager can query for anything
    getAllLoansUsingFilter();
  }
  function onAdmin() { // admin can query for anything
    onManager();
  }
  function onUser() { // user can only query themselves
    if (!userIds || userIds != req.user.id) {
      res.status(401).json(rb.unauthorized());
    } else {
      getAllLoansUsingFilter();
    }
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
