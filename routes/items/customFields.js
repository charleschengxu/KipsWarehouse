const express = require('express')
const router = express.Router()
const _ = require('lodash')
const models = require('../../models')
const db = require('../../models/index')
const rb = require('../utils/resBuilder')
const pc = require('../utils/permissionChecker')
const LOG = require('./customFieldsLogger')
const InstanceCustomFieldsLogger = require('../instances/instanceCustomFieldsLogger')


router.get('/', function (req, res, next) {
	models.custom_fields.findAll({
		order: [['name', 'ASC']],
	}).then(function(found) {
		res.json(rb.success(found))
	})
})


router.put('/convertToPerAsset', function (req, res, next) {
	function onManager() {
		res.status(401).json(rb.unauthorized());
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	function onAdmin() {
		let $ = {};
		db.sequelize.transaction(function (t) {
			return models.custom_fields.findOne({
				where : { name: req.body.name },
			}, {transaction: t})
			.then(function(itemField) {
				return models.instance_custom_fields.findOrCreate({
					where: { name: req.body.name },
					defaults: {
						visibility: itemField.visibility,
						type: itemField.type,
					},
					transaction: t,
				})
			}).spread(function(newInstanceField, isCreated) {
				$.newInstanceField = newInstanceField;
				if (!isCreated) {
					throw new Error(req.body.name + ' already exists as instance custom field');
				} else {
					return models.custom_field_values.findAll({
						where: { name: req.body.name },
						transaction: t
					})
				}
			}).then(function(values){
				return db.sequelize.Promise.each(values, function(v) {
					return models.item_instances.findAll({
						where: { itemId: v.itemId },
						transaction: t,
					}).then(function(instances) {
						return models.instance_custom_field_values.bulkCreate(
							_.map(instances, function(i) {
								return {
									itemInstanceId: i.id,
									name: v.name,
									value: v.value,
								};
							}), { transaction: t}
						)
					})
				})
			}).then(function(created) {
				// delete old field
				return models.custom_fields.destroy({
					where : { name: req.body.name },
				}, {transaction: t})
			}).then(function(deletedField) {
				return models.custom_field_values.destroy({
					where : { name: req.body.name },
				}, {transaction: t})
			}).then(function(done) {
				return LOG.logDeleteCustomField(t, req.user.id, req.body.name, function() {
					return InstanceCustomFieldsLogger.logCreateCustomField(
							t, req.user.id, $.newInstanceField.name,
							$.newInstanceField.type, $.newInstanceField.visibility);
				})
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.post('/:name/:type/:visibility', function (req, res, next) {
	function onManager() {
		res.status(401).json(rb.unauthorized());
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	function onAdmin() {
		let ret
		db.sequelize.transaction(function (t) {
			return models.custom_fields.findOrCreate({
				where : {name: req.params.name},
				defaults: {
					type: req.params.type,
					visibility: req.params.visibility,
				},
				transaction: t,
			}).spread(function(entry, isCreated) {
				if (!isCreated) {
					throw new Error(req.params.name + ' already exists');
				} else {
					ret = entry
					return LOG.logCreateCustomField(
						t, req.user.id, req.params.name, req.params.type, req.params.visibility)
				}
			})
		}).then(function (result) {
			res.json(rb.success(ret))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.put('/:name/:visibility', function (req, res, next) {
	function onManager() {
		res.status(401).json(rb.unauthorized());
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	function onAdmin() {
		let ret
		db.sequelize.transaction(function (t) {
			return models.custom_fields.findOne({
				where : {name: req.params.name},
				transaction: t,
			}).then(function(entry) {
				if (!entry) {
					throw new Error(req.params.name + ' does not exist');
				}
				return entry.updateAttributes(
					{visibility: req.params.visibility}, //type cannot be changed
					{transaction: t}
				).then(function(updatedEntry) {
					ret = updatedEntry
					return LOG.logUpdateCustomField(
						t, req.user.id, req.params.name, req.params.visibility)
				})
			})
		}).then(function (result) {
			res.json(rb.success(ret))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.delete('/:name', function (req, res, next) {
	function onManager() {
		res.status(401).json(rb.unauthorized());
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	function onAdmin() {
		db.sequelize.transaction(function (t) {
			return models.custom_fields.destroy({
				where : {name: req.params.name},
				transaction: t,
			}).then(function(deleted) {
				// also remove this custom field from all items
				return models.custom_field_values.destroy({
					where: { name: req.params.name },
					transaction: t
				}).then(function(deleted2){
					return LOG.logDeleteCustomField(t, req.user.id, req.params.name)
				})
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err));
		})
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})

module.exports = router
