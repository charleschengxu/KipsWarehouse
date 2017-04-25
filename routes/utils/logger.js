const models = require('../../models');

/**
 * build a log object from list of ids and log content
 * @param  {Object} ids     key-value pairs with idname as key
 * @param  {String} content content log
 * @return {Object}         sequelize entry ready to be written to log
 */
function _buildLogObject(ids, content) {
  return {
    srcUserId: ids.srcUserId,
    destUserId: ids.destUserId,
    itemId: ids.itemId,
    orderId: ids.orderId,
    bundleId: ids.bundleId,
    content: content,
  };
}

const logger = {
  SRC: 'srcUserId',
  DEST: 'destUserId',
  ITEM: 'itemId',
  BUNDLE: 'bundleId',
  INSTANCE: 'instanceId',
  /**
   * log an operation as a committed transaction
   * @param  {[type]}   t        Sequelize transaction object
   * @param  {[type]}   ids      key-value pairs with keys
   *                              { srcUserId, destUserId, itemId, orderId, bundleId }
   * @param  {[type]}   content  log content
   * @param  {Function} callback optional
   */
  log: function(t, ids, content, callback) {
    const logObject = _buildLogObject(ids, content);
    return models.logs.create(
      logObject, {transaction: t}
    ).then(function(newLog) {
      if (callback) {
        return callback(newLog);
      }
    })
  },
}

module.exports = logger
