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
 * @param {Number} srcUserId
 * @param {Enum} action
 * @param {Object} params
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
  createLocalUser(t, creatorId, userId) {
    const content = srcUser(creatorId) + ' created new ' + destUser(userId);
    return log(t, content);
  },
  createNetIdUser(t, userId, netId) {
    const content = 'new netID ' + srcUser(userId) + ' (' + netId
      + ') was auto created on first time login';
    return log(t, content);
  },
  changePermission(t, srcUserId, destUserId, permission) {
    const content = srcUser(srcUserId) + ' changed ' + destUser(destUserId)
      + '\'s permission to ' + permission;
    return log(t, content);
  }
}

module.exports = logger;
