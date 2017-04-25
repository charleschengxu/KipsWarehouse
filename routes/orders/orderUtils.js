const _ = require('lodash');
const models = require('../../models');
const logger = require('./orderLogger');

const orderUtils = {
  fillBackfillInfoForRawOrders(config, callback) {
    const rawOrders = config.rawOrders;
    const t = config.t;
    const orderIdsFound = _.map(rawOrders, 'id');
    return models.backfill_proofs.findAll({
      where: { orderId: orderIdsFound },
      transaction: t,
    }).then((proofs) => {
      const orderIdToProofs = _.groupBy(proofs, 'orderId');
      const resultOrders = _.map(rawOrders, (o) => {
        const existingProofs = orderIdToProofs[o.id];
        const filledOrder = o.dataValues || o;
        if (existingProofs && existingProofs.length > 0) {
          filledOrder.backfillStatus = existingProofs[0].backfillStatus;
          filledOrder.proofs = _.map(existingProofs, (p) => {
            return { id: p.id, fileHandle: p.fileHandle, fileName: p.fileName };
          });
        }
        return filledOrder;
      });
      if (callback) return callback(resultOrders);
    });
  },
  fillCommentsForRawOrders(config, callback) {
    const rawOrders = config.rawOrders;
    const t = config.t;
    const bundleIds = _.map(rawOrders, 'bundleId');
    return models.order_bundles.findAll({
      attributes: ['id', 'userComment', 'adminComment'],
      where: { id: bundleIds },
      transaction: t,
    }).then((bundles) => {
      const bundleIdToBundle = _.keyBy(bundles, 'id'); // map the id to each bundle.
      const resultOrders = _.map(rawOrders, (o) => {
        const filledOrder = o.dataValues || o;
        filledOrder.userComment = bundleIdToBundle[o.bundleId].userComment;
        filledOrder.adminComment = bundleIdToBundle[o.bundleId].adminComment;
        return filledOrder;
      });
      if (callback) return callback(resultOrders);
    });
  },
  /**
   * Given a config of rawOrders(sequelize object), fill in username and
   * and itemName, and execute the callback with the filled objects.
   * Can be used with a transaction.
   * @param  {Object}   config {rawOrders, t(optional)}
   * @param  {Function} callback function(resultOrders)
   */
  fillNamesForRawOrders(config, callback) {
    const rawOrders = config.rawOrders;
    const t = config.t;
    const userIds = _.map(rawOrders, 'userId');
    const itemIds = _.map(rawOrders, 'itemId');
    const orderIds = _.map(rawOrders, 'id');

    let userIdToUser;
    let itemIdToItem;
    let orderIdToInsPairs;
    return models.users.findAll({
      attributes: ['id', 'displayName', 'email'],
      where: { id: userIds },
      transaction: t,
    }).then((users) => {
      userIdToUser = _.keyBy(users, 'id'); // map the id to each user.
      return models.items.findAll({
        attributes: ['id', 'name', 'isAsset'],
        where: { id: itemIds },
        transaction: t,
      });
    }).then((items) => {
      itemIdToItem = _.keyBy(items, 'id'); // map the id to each item.
      return models.order_instance_pairs.findAll({
        where: { orderId: orderIds },
        transaction: t,
      });
    }).then((orderInsPairs) => {
      orderIdToInsPairs = _.groupBy(orderInsPairs, 'orderId'); // {orderId -> [pair1, pair2, ...]}
      const allInstanceIds = _
        .chain(orderInsPairs)
        .map('instanceId')
        .uniq()
        .value();
      return models.item_instances.findAll({
        where: { id: allInstanceIds },
        transaction: t,
      });
    }).then((instances) => {
      const instanceIdToInstance = _.keyBy(instances, 'id');
      const orderIdToInstances = {};
      _.each(orderIdToInsPairs, (pairs, orderId) => {
        orderIdToInstances[orderId] = _.map(pairs, pair => instanceIdToInstance[pair.instanceId]);
      }); // {orderId -> [insObj1, insObj2, ...]}
      const resultOrders = _.map(rawOrders, (o) => {
        const filledOrder = o.dataValues || o;
        filledOrder.userName = userIdToUser[o.userId].displayName;
        filledOrder.displayName = userIdToUser[o.userId].displayName;
        filledOrder.userEmail = userIdToUser[o.userId].email;
        filledOrder.itemName = itemIdToItem[o.itemId].name;
        filledOrder.isAsset = itemIdToItem[o.itemId].isAsset;
        filledOrder.instances = _.sortBy(orderIdToInstances[o.id], 'assetTag');
        return filledOrder;
      });
      if (callback) return callback(resultOrders);
    });
  },
  /**
   * Given a config of rawBundles(sequelize object), fill in username
   * and execute the callback with the filled objects.
   * Can be used with a transaction.
   * @param  {Object}   config {rawBundles, t(optional)}
   * @param  {Function} callback function(resultOrders)
   */
  fillUserNamesForRawBundles(config, callback) {
    const rawBundles = config.rawBundles;
    const t = config.t;
    const userIds = _.map(rawBundles, 'userId');
    return models.users.findAll({
      attributes: ['id', 'displayName'],
      where: { id: userIds },
      transaction: t,
    }).then((users) => {
      const userIdToUser = _.keyBy(users, 'id'); // map the id to each user.
      const resultBundles = _.map(rawBundles, (o) => {
        const filledBundle = o.dataValues || o;
        filledBundle.displayName = userIdToUser[o.userId].displayName;
        return filledBundle;
      });
      return callback(resultBundles);
    });
  },
  /**
   * Deduct an item's quantity with the config provided, and log.
   * @param  {Object} config {userId, itemId, quantity, t, bundleId}
   */
  deductQuantityAndLog(config) {
    const t = config.t;
    return models.items.findOne({
      where: { id: config.itemId },
      transaction: t
    }).then((itemToBeDeducted) => {
      if (itemToBeDeducted.quantity < config.quantity) {
        throw new Error('Failed to process request. Please check available quantity.');
      }
      return itemToBeDeducted.decrement(
        'quantity', { by: config.quantity, transaction: t }
      );
    }).then(() => {
      return logger.deductQuantityOnApproval( // log the deduction.
        t, config.userId, config.itemId, config.quantity, config.bundleId
      );
    });
  },
  /**
   * Increase an item's quantity with the config provided, and log.
   * @param  {Object} config {userId, itemId, quantity, t, bundleId}
   */
  addQuantityAndLog(config) {
    const t = config.t;
    return models.items.findOne({
      where: { id: config.itemId },
      transaction: t
    }).then((itemToBeAdded) => {
      return itemToBeAdded.increment(
        'quantity', { by: config.quantity, transaction: t }
      );
    }).then(() => {
      return logger.addQuantityOnReturn( // log the deduction.
        t, config.userId, config.itemId, config.quantity, config.bundleId
      );
    });
  },
  /**
   * A util function that will correctly format the instanceMap.
   * Due to the nature of query string, if we put url?arr=1,
   * this arr will be interpreted as a single number.
   * But url?arr=1&arr=2 will be interpreted as an array [1, 2].
   * That's what this method does - ensure the correct formatting
   * for instanceMap, which is an object that has  orderId -> [instanceIds] pair.
   * @param  {Object} instanceMap
   */
  normalizeInstanceMap(instanceMap) {
    if (!instanceMap || Array.isArray(instanceMap)) {
      return {};
    }
    try {
      return _.each(instanceMap, (instanceIds, orderId) => {
        instanceMap[orderId] = this.normalizeInstanceIds(instanceIds);
      });
    } catch (e) {
      return {};
    }
  },
  /**
   * A simpler version. Ensure instanceIds is in the form of an array.
   * If it's not an array nor a number, return [].
   */
  normalizeInstanceIds(instanceIds) {
    if (Number.isInteger(instanceIds)) {
      return [Number(instanceIds)];
    } else if (Array.isArray(instanceIds)) {
      return instanceIds;
    }
    return [];
  },
  /**
   * Same as normalizeInstanceIds but with a different name to avoid confusion.
   */
  normalizeOrderIds(orderIds) {
    return this.normalizeInstanceIds(orderIds);
  },
}

module.exports = orderUtils;
