const _ = require('lodash');
const queryString = require('query-string');
const filestack = require('filestack-js');
const configAccessor = require('./configAccessor');
const userAccessor = require('./userAccessor');
const itemAccessor = require('./itemAccessor');
const config = require('../config/config');

const filestackClient = filestack.init(config.filepicker.api_key);
const API_URL = configAccessor.getApiUrl();

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

/**
 * @param  {Number}  userId
 * @param  {Number}  itemId
 * @param  {Number}  quantity
 * @param  {Object}  extra
 *   {orderStatus, type(DISBURSE, LOAN), adminComment(for dispatch only),
 *    instanceIds(for asset)}
 */
async function _createOrderAsync(userId, itemId, quantity, extra) {
  const createOrderUrl =
    API_URL + 'ordersv2/' + itemId + '/' + quantity + '/' + userId + '/';
  const body = {
    type: extra.type || undefined,
    adminComment: extra.adminComment || undefined,
    orderStatus: extra.orderStatus || undefined,
    instanceIds: extra.instanceIds || undefined,
  };
  const response = await fetch(createOrderUrl, {
    method: 'POST',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log('_createOrderAsync response: ', responseJson);
  return responseJson;
}

/**
 * @param  {Number}  userId          dispatch to user
 * @param  {Number}  itemId
 * @param  {Number}  quantity
 * @param  {String}  type            DISBURSE or LOAN
 * @param  {String}  dispatchComment optional comment about this dispatch
 * @param  {Array<Number>}  instanceIds an optional array of instanceIds if the
 *                                      item is an asset.
 * @return {Object}
 *   {status, error, data} where data is a bundle instance
 */
async function _dispatchOrderToUserWithTypeAsync(
  userId, itemId, quantity, type, dispatchComment, instanceIds
) {
  const extra = {
    type,
    orderStatus: 'DISPATCHED',
    adminComment: dispatchComment || undefined,
    instanceIds: instanceIds || undefined,
  };
  return _createOrderAsync(userId, itemId, quantity, extra);
}

/**
 * @param  {Number}  bundleId [description]
 * @param  {Object}  update
 *   {type(required on approval, either DISBURSE or LOAN),
 *    bundleStatus(required), adminComment(optional)
 *    and instanceMap(for approval)}
 */
async function _updateBundleAsync(bundleId, update) {
  const updateBundleUrl = API_URL + 'ordersv2/' + bundleId + '/';
  const body = {
    adminComment: update.adminComment || undefined,
    bundleStatus: update.bundleStatus,
    instanceMap: update.instanceMap || undefined,
    type: update.type,
  };
  const response = await fetch(updateBundleUrl, {
    method: 'PUT',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log('RESPONSE _updateBundleAsync: ', responseJson);
  return responseJson;
}

/**
 * @param  {Number}  bundleId   bundleId
 * @param  {String}  type       DISBURSE or LOAN
 * @param  {String}  adminComment optional
 * @param  {Object}  instanceMap an object that holds the orderId -> instanceIds pairs
 *                               Optional. But required when this bundle contains assets.
 *                               Key(OrderId) is the per-item-based orderId,
 *                               Value(Array<Number>) is the instanceIds you want to associate
 *                                                with this order.
 *        Example of instanceMap
 *         {
 *           orderId1: [instanceId1, instanceId2, ...],
 *           201: [23, 24, 25],
 *           203: [88],
 *         }
 */
async function _approveBundleWithTypeAsync(bundleId, type, adminComment, instanceMap) {
  const update = {
    type,
    bundleStatus: 'APPROVED',
    adminComment: adminComment || undefined,
    instanceMap: instanceMap || undefined,
  };
  return _updateBundleAsync(bundleId, update);
}


/**
 * @param  {Number}  id   bundleId or orderId
 * @param  {Boolean} isBundle indicate whether it's a bundle(true) or an order
 * @param  {Boolean} isReturn indicate whether it's a return(true) or a conversion
 */
async function _convertOrReturnAsync(id, isBundle, isReturn) {
  const updateLoanUrl = API_URL + 'ordersv2/' + id + '/'
    + (isBundle ? 'BUNDLE' : 'ORDER');
  const body = {
    isReturn: isReturn || undefined,
    isConvert: !isReturn || undefined,
  };
  const response = await fetch(updateLoanUrl, {
    method: 'PUT',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log('RESPONSE _convertOrReturnAsync: ', responseJson);
  return responseJson;
}

/**
 * Get all orders with query as filter.
 * Note that for normal users, all the filters will still apply,
 * but only their own loans will be returned.
 * @param  {Object}  query
 *  {itemIds: [Number], userIds: [Number], statuses: [String]
 *  rowPerPage: Number, pageNumer: Number}
 * @return {Object}
 *   {status, error, data} where data is an array of loan instances
 */
async function _getLoanOrdersByQueryAsync(query) {
  if (!query) { query = {}; }
  if (userAccessor.getPermission() == 'USER') {
    // normal user can only see their own loan orders
    query.userIds = [userAccessor.getId()];
  }
  const queryParams = {};
  let getLoansUrl = API_URL + 'loans/';
  if (query) {
    queryParams.itemIds = query.itemIds || undefined;
    queryParams.userIds = query.userIds || undefined;
    queryParams.statuses = query.statuses || undefined;
    queryParams.rowPerPage = query.rowPerPage || undefined;
    queryParams.pageNumber = query.pageNumber || undefined;
    queryParams.filterByEitherUserIdsOrItemIds
      = query.filterByEitherUserIdsOrItemIds || undefined;
    getLoansUrl += '?' + queryString.stringify(queryParams);
  }
  console.log('getLoansUrl: ', getLoansUrl);
  const response = await fetch(getLoansUrl, {
    method: 'GET',
    headers: userAccessor.getAuthHeader(),
  });
  const responseJson = await response.json();
  console.log('RESPONSE getLoanOrdersByQueryAsync: ', responseJson);
  return responseJson;
}

/**
 * @param  {Number}  id   orderId or bundleId
 * @param  {String}  type 'ORDER' or 'BUNDLE'
 */
async function _deleteOrderOrBundleAsync(id, type) {
  const deleteUrl = API_URL + 'ordersv2/' + id + '/' + type + '/';
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: userAccessor.getAuthHeader(),
  });
  const responseJson = await response.json();
  console.log('RESPONSE _deleteOrderOrBundleAsync: ', responseJson);
  return responseJson;
}

/**
 * @param  {String}  userComment required comment
 * @param  {String}  type LOAN/DISBURSE
 */
async function _submitCartWithTypeAsync(userComment, type) {
  const submitCartUrl = API_URL + 'ordersv2/' + userAccessor.getId();
  const body = { userComment, type };
  const response = await fetch(submitCartUrl, {
    method: 'POST',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log('RESPONSE _submitCartWithTypeAsync: ', responseJson);
  return responseJson;
}

/**
 * Approve/Deny the backfill request for an order.
 * @param  {Number}  orderId
 */
async function _approveOrDenyBackfillForOrderAsync(orderId, backfillStatus) {
  const processBackfillUrl = API_URL + 'backfills/' + orderId;
  const body = { backfillStatus };
  const response = await fetch(processBackfillUrl, {
    method: 'PUT',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log('RESPONSE _approveOrDenyBackfillForOrderAsync: ', responseJson);
  return responseJson;
}

async function getFilenameFromHandleAsync(fileHandle) {
  const file = await filestackClient.metadata(fileHandle, { filename: true });
  return file.filename;
}

const orderAccessor = {
  // =========================================================================
  // Cart.
  // =========================================================================
  /**
   * @param  {Number}  itemId
   * @param  {Number}  quantity
   * @return {Object}
   *   {status, error} with no data field.
   */
  async addOrderToCartAsync(itemId, quantity) {
    const userId = userAccessor.getId();
    const extra = { orderStatus: 'CARTED' };
    return _createOrderAsync(userId, itemId, quantity, extra);
  },
  /**
   * @param  {Number}  orderId
   * @return {Object}
   *   {status, error} with no data field.
   */
  async removeOrderFromCartAsync(orderId) {
    return _deleteOrderOrBundleAsync(orderId, 'ORDER');
  },
  async getMyCartedOrdersAsync() {
    const getOrdersUrl = API_URL + 'ordersv2/cart/' + userAccessor.getId();
    const response = await fetch(getOrdersUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('RESPONSE getMyCartedOrdersAsync: ', responseJson);
    return responseJson;
  },
  // =========================================================================
  // Bundles and Orders. Ev2.
  // =========================================================================
  /**
   * @param {String} partialName itemName, username or displayName
   * @return {Object}
   *   {status, error, data} where data is an array of bundle instances
   */
  async searchBundlesByItemAndUserNameAsync(partialName) {
    const itemRes = await itemAccessor.searchItemsByNameAsync(partialName);
    const query = {};
    if (itemRes.status == 'success') {
      query.itemIds = _.uniq(_.map(itemRes.data, 'id'));
      query.itemIds.push(-1); //hack to avoid empty array not being sent
    }
    if (userAccessor.getPermission() == 'USER') {
      // normal user can only see their own bundles
      query.userIds = [userAccessor.getId()];
    } else {
      const userRes = await userAccessor.searchUsersByNameAsync(partialName);
      if (userRes.status == 'success') {
        query.userIds = _.uniq(_.map(userRes.data, 'id'));
        query.userIds.push(-1); //hack to avoid empty array not being sent
        query.filterByEitherUserIdsOrItemIds = true;
      }
    }
    return this.getAllBundlesByQueryAsync(query);
  },
  async getBundleByIdAsync(bundleId) {
    const query = { bundleIds: [bundleId] };
    return this.getAllBundlesByQueryAsync(query);
  },
  /**
   * Get all bundles with query as filter.
   * Note that for normal users, all the filters will still apply,
   * but only their own bundles will be returned.
   * @param  {Object}  query
   *   {bundleIds: [Number], itemIds: [Number], userIds: [Number],
   *   types: [String e.g. DISBURSE/LOAN], statuses: [String e.g. APPROVED/PENDING],
   *   rowPerPage: Number, pageNumer: Number}
   * @return {Object}
   *   {status, error, data} where data is an array of bundle instances
   */
  async getAllBundlesByQueryAsync(query) {
    query = query || {};
    let getBundlesUrl = API_URL + 'ordersv2/';
    if (userAccessor.getPermission() == 'USER') {
      // normal user can only see their own bundles
      query.userIds = [userAccessor.getId()];
    }
    const queryParams = {
      bundleIds: query.bundleIds || undefined,
      itemIds: query.itemIds || undefined,
      userIds: query.userIds || undefined,
      types: query.types || undefined,
      statuses: query.statuses || undefined,
      rowPerPage: query.rowPerPage || undefined,
      pageNumber: query.pageNumber || undefined,
      filterByEitherUserIdsOrItemIds: query.filterByEitherUserIdsOrItemIds || undefined,
    };
    getBundlesUrl += '?' + queryString.stringify(queryParams);
    console.log('getBundlesUrl: ', getBundlesUrl);
    const response = await fetch(getBundlesUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('RESPONSE getBundlesByQueryAsync: ', responseJson);
    return responseJson;
  },
  /**
   * @param  {Number}  bundleId
   * @return {Object}
   *   {status, error, data} where data is an array of order instances
   */
  async getOrdersByBundleIdAsync(bundleId) {
    let getOrdersUrl = API_URL + 'ordersv2/' + bundleId + '/';
    console.log('getOrdersUrl: ', getOrdersUrl);
    const response = await fetch(getOrdersUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('RESPONSE getOrdersByBundleIdAsync: ', responseJson);
    return responseJson;
  },
  /**
   * @param  {Number}  bundleId
   * @return {Object}
   *   {status, error} with no data field.
   */
  async deleteBundleAsync(bundleId) {
    return _deleteOrderOrBundleAsync(bundleId, 'BUNDLE');
  },
  /**
   * @param  {Number}  bundleId
   * @param  {String}  adminComment optional
   * @return {Object}  {status, error, data} where data is a bundle instance
   */
  async denyBundleAsync(bundleId, adminComment) {
    const update = {
      bundleStatus: 'DENIED',
      adminComment: adminComment || undefined,
    };
    return _updateBundleAsync(bundleId, update);
  },

  // =========================================================================
  // Loans and its return/convert. Ev3.
  // =========================================================================
  async submitCartAsLoanAsync(userComment) {
    return _submitCartWithTypeAsync(userComment, 'LOAN');
  },
  async submitCartAsDisburseAsync(userComment) {
    return _submitCartWithTypeAsync(userComment, 'DISBURSE');
  },
  /**
   * @param  {Array<Number>}  instanceIds an optional array of instanceIds if the
   *                                      item is an asset.
   */
  async dispatchLoanToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds) {
    return _dispatchOrderToUserWithTypeAsync(userId, itemId, quantity, 'LOAN', dispatchComment, instanceIds);
  },
  async dispatchDisburseToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds) {
    return _dispatchOrderToUserWithTypeAsync(userId, itemId, quantity, 'DISBURSE', dispatchComment, instanceIds);
  },
  /**
   * @param  {Object}  instanceMap an object that holds the orderId -> instanceIds pairs
   *                               Optional. But required when this bundle contains assets.
   *                               Key(OrderId) is the per-item-based orderId,
   *                               Value(Array<Number>) is the instanceIds you want to associate
   *                                                with this order.
   *        Example of instanceMap
   *         {
   *           orderId1: [instanceId1, instanceId2, ...],
   *           201: [23, 24, 25],
   *           203: [88],
   *         }
   */
  async approveBundleAsLoanAsync(bundleId, adminComment, instanceMap) {
    return _approveBundleWithTypeAsync(bundleId, 'LOAN', adminComment, instanceMap);
  },
  async approveBundleAsDisburseAsync(bundleId, adminComment, instanceMap) {
    return _approveBundleWithTypeAsync(bundleId, 'DISBURSE', adminComment, instanceMap);
  },
  async returnLoanBundleAsync(bundleId) {
    return _convertOrReturnAsync(bundleId, true, true);
  },
  async returnLoanOrderAsync(orderId) {
    return _convertOrReturnAsync(orderId, false, true);
  },
  async convertLoanBundleToDisburseAsync(bundleId) {
    return _convertOrReturnAsync(bundleId, true, false);
  },
  async convertLoanOrderToDisburseAsync(orderId) {
    return _convertOrReturnAsync(orderId, false, false);
  },
  async getCurrentLoansByItemIdAsync(itemId) {
    const query = {
      itemIds: [itemId],
      statuses: ['DISPATCHED', 'APPROVED'],
    };
    return _getLoanOrdersByQueryAsync(query);
  },
  /**
   * @param {String} partialName itemName, username or displayName
   * @return {Object}
   *   {status, error, data} where data is an array of bundle instances
   */
  async getCurrentLoansByNameAsync(partialName) {
    const query = { statuses: ['DISPATCHED', 'APPROVED'] };
    if (partialName && partialName.length > 0) {
      // search for items and users first, and use those ids to query loans.
      const itemRes = await itemAccessor.searchItemsByNameAsync(partialName);
      if (itemRes.status === 'success') {
        query.itemIds = _.uniq(_.map(itemRes.data, 'id'));
        query.itemIds.push(-1); // hack to avoid empty array not being sent
      }
      if (userAccessor.getPermission() === 'USER') {
        // normal user can only see their own bundles
        query.userIds = [userAccessor.getId()];
      } else {
        const userRes = await userAccessor.searchUsersByNameAsync(partialName);
        if (userRes.status === 'success') {
          query.userIds = _.uniq(_.map(userRes.data, 'id'));
          query.userIds.push(-1); //hack to avoid empty array not being sent
          query.filterByEitherUserIdsOrItemIds = true;
        }
      }
    }
    return _getLoanOrdersByQueryAsync(query);
  },
  // =========================================================================
  // Backfill. Ev4, finally.
  // =========================================================================
  //

  /**
   * Submit a proof in form of a fileHandle to the orders provided.
   * optionally mark the orderIds provided
   * @param  {String}  fileHandle
   * @param  {Array<Number>}  orderIds   orders that should be associated with the proof.
   */
  async submitProofForOrdersAsync(orderIds, fileHandle) {
    const submitProofUrl = API_URL + 'backfills/';
    const fileName = await getFilenameFromHandleAsync(fileHandle);
    const body = { fileHandle, fileName, orderIds };
    const response = await fetch(submitProofUrl, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log('RESPONSE submitProofForOrdersAsync: ', responseJson);
    return responseJson;
  },
  /**
   * Remove a proof with proofId from the corresponding order.
   * @param  {Number}  proofId proof to be removed.
   */
  async removeProofAsync(proofId) {
    const removeProofUrl = API_URL + 'backfills/' + proofId;
    const response = await fetch(removeProofUrl, {
      method: 'DELETE',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('RESPONSE removeProofAsync: ', responseJson);
    return responseJson;
  },
  /**
   * Approve the backfill request for an order.
   * @param  {Number}  orderId
   */
  async approveBackfillForOrderAsync(orderId) {
    return _approveOrDenyBackfillForOrderAsync(orderId, 'APPROVED');
  },
  /**
   * Deny the backfill request for an order.
   * @param  {Number}  orderId
   */
  async denyBackfillForOrderAsync(orderId) {
    return _approveOrDenyBackfillForOrderAsync(orderId, 'DENIED');
  },
  /**
   * Bulk approve all the backfill request for a bundle.
   * This will probably not be commonly used since approval of Backfill
   * should tend to happen in a per-item-based order.
   * Leave as placeholder.
   * @param  {Number}  bundleId
   */
  async approveAllBackfillsForBundleAsync(bundleId) {},
  /**
   * Bulk deny all the backfill request for a bundle.
   * This will probably not be commonly used since approval of Backfill
   * should tend to happen in a per-item-based order.
   * Leave as placeholder.
   * @param  {Number}  bundleId
   */
  async denyAllBackfillsForBundleAsync(bundleId) {},
};

module.exports = orderAccessor;
