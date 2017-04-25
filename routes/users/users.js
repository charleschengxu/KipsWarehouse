const express = require('express');
const router = express.Router();
const models = require('../../models');
const signup = require('./signup');
const auth = require('../auth/auth');
const db = require('../../models/index');
const pc = require('../utils/permissionChecker');
const rb = require('../utils/resBuilder');
const logger = require('./userLogger');
const queryBuilder = require('../utils/queryBuilder');

/**
 * GET all the users with filters.
 */
router.get('/', (req, res) => {
	const name = req.query.name;
	const queryUserId = req.query.userId;
	const query = { attributes: { exclude: ['password'] } };
	if (queryUserId) {
		query.where = {id: Number(queryUserId)};
	} else if (name) {
		query.where = { $or: [
			{ username: { $like: '%' + name + '%' } },
			{ displayName: { $like: '%' + name + '%' } },
		]};
	}
	queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
	queryBuilder.orderBy(query, 'displayName', true);
	function onManager() {
		models.users.findAll(query).then((users) => {
	    res.json(rb.success(users));
	  });
	}
	function onAdmin() {
		onManager();
	}
	function onUser() {// normal users can only query themselves
		if (queryUserId && req.user.id == queryUserId) {
			onManager();
		} else {
			res.status(400).json(
				rb.unauthorized('unauthorized to get information of other users')
			);
		}
	}
	pc.check(req.user, onAdmin, onManager, onUser);
})

/**
 * Get a JWT key for a logged-in user
 */
router.get('/apikey', function(req, res) {
	res.json(rb.success('JWT ' + auth.generateJWT(req.user.id, true)));
});

/* POST signup a new user */
router.use('/', signup);

/* PUT update an existing user*/
router.put('/:userId', function (req, res) {
	const queryUserId = req.params.userId;
	function update() {
	  models.users.findById(queryUserId).then(function(user) {
	    if (!user) { //no user with queryUserId
	      res.status(400).json(rb.failure(
					'no user with id ' + queryUserId + ' is found',
					rb.ERROR.CAN_NOT_UPDATE_USER
				));
	    } else {
	      let permissionChanged = false, responseUser;
	      if (req.body.email) { //email field
	        user.email = req.body.email;
	      }
				if (req.body.permission) { //permission field
					user.permission = req.body.permission;
					permissionChanged = true;
				}
				db.sequelize.transaction(function(t) {
					return user.save({ transaction: t }).then(function(updatedUser) {
						responseUser = updatedUser.dataValues;
						responseUser.password = undefined; //remove the password field from response
						if (permissionChanged) {// if permission changed, log it.
							return logger.changePermission(
								t, req.user.id, updatedUser.id, updatedUser.permission
							);
						}
	        });
				}).then(function(result) { //committed
					res.json(rb.success(responseUser));
				}).catch(function(error) {
					res.status(400).json(rb.failure(error.message, rb.ERROR.TRANSACTION_ERR));
				});
	  }});
	}
	function onAdmin() { //admin can do anything.
		update();
	}
	function onUser() { //user can only update themselves.
		if (queryUserId != req.user.id) {
			res.json(
				rb.unauthorized('User and Manager can only update their own information')
			);
		} else if (req.body.permission) {
			res.json(
				rb.unauthorized('User and Manager can not update their permission')
			);
		} else {
			update();
		}
	}
	function onManager() { //same as user.
		onUser();
	}
	pc.check(req.user, onAdmin, onManager, onUser);
});

router.delete('/:userId', function (req, res) {
	res.json(rb.failure('Delete for user is not supported for ev1'));
});

module.exports = router;
