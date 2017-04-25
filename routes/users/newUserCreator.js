const models = require('../../models');
const bcrypt = require('bcryptjs');
const rb = require('../utils/resBuilder');
const db = require('../../models/index');
const auth = require('../auth/auth');
const logger = require('./userLogger');

/**
 * @param  {Object} userObject
 *  {username, displayName, password, email, netId, isNetIdUser, permission}
 * @param  {Object} config {creatorId, res, signInAfterCreated}
 * where creatorId is an optional id indicating the creator (for log purpose),
 *   res is the res object provided by Express,
 *   signInAfterCreated is a boolean indicating whether sign in after creation
 */
function createNewUser(userObject, config) {
  const creatorId = config.creatorId;
  const res = config.res;
  const signInAfterCreated = config.signInAfterCreated;
  if (
    (userObject.password == null && userObject.isNetIdUser == 0)
    || (userObject.password != null && userObject.isNetIdUser != 0)
  ) {// password is null if and only if it's a netIdUser
    res.json(rb.failure('Fail to create new user'));
  } else if (userObject.email == null) {
    res.json(rb.failure('Must provide an email'));
  } else {//Create
    let password = null;
    if (userObject.password != null) {
      password = bcrypt.hashSync(userObject.password, 8);
    }
    let responseUser;
    db.sequelize.transaction(function(t) {
      return models.users.create({
        username: userObject.username,
        displayName: userObject.displayName || userObject.username,
        password: password,
        email: userObject.email || null,
        netId: userObject.netId || null,
        isNetIdUser: userObject.isNetIdUser,
        permission: userObject.permission || 'USER',
      }, {transaction: t}).then(function(newUser) {
        responseUser = newUser.dataValues;
        responseUser.password = undefined;
        if (signInAfterCreated) {
          responseUser.token = auth.generateJWT(responseUser.id);
        }
        if (creatorId) {//log the creation of local user
          return logger.createLocalUser(t, creatorId, newUser.id);
        } else {//log the auto-creation of netid user
          return logger.createNetIdUser(t, newUser.id, newUser.netId);
        }
      });
    }).then(function (result) { //committed
      res.json(rb.success(responseUser));
    }).catch(function (error) {
      res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
    })
  }
}

module.exports = {create: createNewUser};
