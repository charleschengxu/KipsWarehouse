const models = require('../../models');

// id ENUMs
const ITEM = 'itemId';
const SRC = 'srcUserId';
const DEST = 'destUserId';
const BUNDLE = 'bundleId';

// id creators
function item(itemId) {
  return 'item ' + ITEM + itemId;
}
function srcUser(userId) {
  return 'user ' + SRC + userId;
}
function destUser(userId) {
  return 'user ' + DEST + userId;
}
function bundle(bundleId) {
  return 'request ' + BUNDLE + bundleId;
}

/**
 * @param {Object} t transaction
 * @param {String} content
 */
function log(t, content) {
  const logObject = buildLogObject(content);
  return models.logs.create(logObject, {transaction: t});
}

/**
 * build a log object with the given str.
 * @param  {String} str
 * @return {Object} a log object that can be created as a sequelize log object.
 */
function buildLogObject(str) {
  let log = {content: str};
  let targets = [ITEM, SRC, DEST, BUNDLE];
  targets.forEach(entry => {
    let index = str.indexOf(entry);
    if (index >= 0) {
      log[entry] = _getNumberAtIndex(str, index + entry.length);
    }
  });
  return log;
}

/**
 * Get the number at index i of str.
 */
function _getNumberAtIndex(str, i) {
  const zero = '0'.charCodeAt(0);
  const nine = '9'.charCodeAt(0);
  let firstChar, num = 0;
  firstChar = str.charCodeAt(i);
  if (firstChar < zero || firstChar > nine) {
    console.log('log parsing error in string ', str, ' at index ', i);
    throw new Error(); //abort the transaction.
  }
  return parseInt(str.substring(i));
}

const logger = {
  createBundle(t, userId, bundleId) {
    const content = srcUser(userId) + ' submitted a ' + bundle(bundleId);
    return log(t, content);
  },
  createBundleOfItem(t, userId, itemId, quantity, bundleId) {
    const content = srcUser(userId) + ' requested ' + item(itemId)
      + ' with quantity ' + quantity + ' under ' + bundle(bundleId);
    return log(t, content);
  },
  deleteBundle(t, userId, bundleId) {
    const content = srcUser(userId) + ' deleted the pending ' + bundle(bundleId);
    return log(t, content);
  },
  approveBundle(t, srcUserId, destUserId, bundleId) {
    const content =
      srcUser(srcUserId) + ' approved ' +
      destUser(destUserId) + '\'s ' + bundle(bundleId);
    return log(t, content);
  },
  denyBundle(t, srcUserId, destUserId, bundleId) {
    const content =
      srcUser(srcUserId) + ' denied ' +
      destUser(destUserId) + '\'s ' + bundle(bundleId);
    return log(t, content);
  },
  dispatchBundle(t, srcUserId, destUserId, bundleId) {
    const content =
      srcUser(srcUserId) + ' dispatched ' + bundle(bundleId) +
      ' to ' + destUser(destUserId);
    return log(t, content);
  },
  deductQuantityOnApproval(t, userId, itemId, quantity, bundleId) {
    const content =
      item(itemId) + '\'s quantity is deducted by ' + quantity + ' on '
      + srcUser(userId) + '\'s approval or dispatch of ' + bundle(bundleId);
    return log(t, content);
  },
  addQuantityOnReturn(t, userId, itemId, quantity, bundleId) {
    const content =
      item(itemId) + '\'s quantity is increased by ' + quantity
      + ' on its return marked by ' + srcUser(userId)
      + '. See ' + bundle(bundleId);
    return log(t, content);
  },
  returnLoanBundle(t, userId, bundleId) {
    const content =
      srcUser(userId) + ' marked ' + bundle(bundleId) + ' as returned.';
    return log(t, content);
  },
  convertLoanBundleToDisburse(t, userId, bundleId) {
    const content =
      srcUser(userId) + ' converted ' + bundle(bundleId)
      + ' from a loan to a disbursement.';
    return log(t, content);
  },
  convertLoanOrderToDisburse(t, userId, itemId, quantity, bundleId) {
    const content =
      srcUser(userId) + ' converted ' + quantity + ' ' + item(itemId)
      + ' from a loan to a disbursement. See ' + bundle(bundleId);
    return log(t, content);
  },
  convertLoanOrderToDisburseOnBackfillApproval(t, userId, itemId, quantity, bundleId) {
    const content =
      srcUser(userId) + ' converted ' + quantity + ' ' + item(itemId)
      + ' from a loan to a disbursement on approval of its backfill request.'
      + ' See ' + bundle(bundleId);
    return log(t, content);
  },
  approveBackfill(t, userId, itemId, quantity, bundleId) {
    const content =
      srcUser(userId) + ' approved a backfill request involving '
      + quantity + ' ' + item(itemId) + ' in ' + bundle(bundleId);
    return log(t, content);
  },
  denyBackfill(t, userId, itemId, quantity, bundleId) {
    const content =
      srcUser(userId) + ' denied a backfill request involving '
      + quantity + ' ' + item(itemId) + ' in ' + bundle(bundleId);
    return log(t, content);
  },
  submitBackfill(t, userId, bundleId) {
    const content =
      srcUser(userId) + ' submitted a backfill proof. See ' + bundle(bundleId);
    return log(t, content);
  },
}

module.exports = logger;
