const express = require('express')
const router = express.Router()
const _ = require('lodash')
const models = require('../../models')
const db = require('../../models/index');
const checker = require('../auth/permission')
const pc = require('../utils/permissionChecker')
const rb = require('../utils/resBuilder')
const queryBuilder = require('../utils/queryBuilder')
const instanceCustomFields = require('./instanceCustomFields')
const instancesUtil = require('./instancesUtil')
const Logger = require('./instancesLogger')
const ct = require('../utils/checkThreshold')


// TODO disable direct editing of item quantity if item is assets
// TODO migrate to csv



router.use('/customFields', instanceCustomFields)


router.get('/', function (req, res, next) {
	function _getInstances(showPrivate) {
		const itemId = Number(req.query.itemId) || undefined;
		const assetTag = Number(req.query.assetTag) || undefined;
		let query = {};
		queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
		if (itemId || assetTag) {
			query.where = {};
			if (itemId) query.where.itemId = itemId;
			if (assetTag) query.where.assetTag = assetTag;
		}
		let ret;
		let $ = {}; // scope object
		db.sequelize.transaction(function (t) {
			query.transaction = t;
			return models.item_instances.findAll(query)
			.then(function(instances) {
				let editableInstances = _.map(instances, (i) => { return i.dataValues });
				$.instancesNoFieldsById = _.keyBy(editableInstances, 'id')
				return models.item_instances.findAll({
					include: [{ model: models.instance_custom_field_values }],
					transaction: t,
				})
			}).then(function(instanceFields) {
				$.instanceFieldsById = _.keyBy(instanceFields, 'id')
				return models.instance_custom_fields.findAll({
					attributes: ['name', 'type', 'visibility'],
					transaction: t,
				})
			}).then(function(allFields) {
				for (let iid in $.instancesNoFieldsById) {
					$.instancesNoFieldsById[iid] = instancesUtil.populateCustomFieldsOnInstance(
						$.instancesNoFieldsById[iid], allFields,
						$.instanceFieldsById[iid].instance_custom_field_values, showPrivate)
				}
				ret = _.values($.instancesNoFieldsById);
			})
		}).then(function (result) {
			res.json(rb.success(ret));
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onManager() { _getInstances(true); }
	function onAdmin() { _getInstances(true); }
	function onNormalUser() { _getInstances(false); }
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.post('/:itemId', function (req, res, next) {
	function onManager() {
		let $ = {};
		db.sequelize.transaction(function (t) {
			return instancesUtil.createOneInstance(req, t, $)
			.then(function() {
				return models.items.findOne({
					where: { id: req.params.itemId },
				}, {transaction: t})
			}).then(function(item){
				if (!item) throw new Error('Cannot find item with id ' + req.params.itemId);
				let newQuantity = ("undefined" === typeof req.body.instanceStatus || req.body.instanceStatus == 'AVAILABLE')?
						(item.quantity + 1) : item.quantity;
				return item.updateAttributes({
					quantity: newQuantity,
				}, {transaction: t})
			}).then(function(markAsDeleted){
				return Logger.logCreateInstance(t, req.user.id, req.body, $.newInstanceFullInfo.id)
			})
		}).then(function (result) {
			res.json(rb.success($.newInstanceFullInfo))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() {
		onManager()
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.put('/:assetTag', function (req, res, next) {
	function onManager() {
		let $ = {};
		db.sequelize.transaction(function (t) {
			return models.item_instances.findOne({
				where: {assetTag: req.params.assetTag},
			}, {transaction: t})
			.then(function(oldInstance){
				$.oldInstance = oldInstance;
				$.newAesstTag = Number(req.body.assetTag);
				return models.item_instances.findOne({
					where: {assetTag: $.newAesstTag},
				}, {transaction: t})
			}).then(function(potentialDuplicate){
				// new assetTag equal to old assetTag is NOT considered as duplication
				if (potentialDuplicate && $.newAesstTag != Number($.oldInstance.assetTag))
					throw new Error('The asset tag ' + req.body.assetTag + ' already exists');
				return $.oldInstance.updateAttributes({
					assetTag: ($.newAesstTag || $.newAesstTag == 0) ? $.newAesstTag : $.oldInstance.assetTag,
					instanceStatus: req.body.instanceStatus || $.oldInstance.instanceStatus,
				}, {transaction: t})
			}).then(function(updatedInstance) {
				$.updatedInstance = updatedInstance;
				return models.instance_custom_field_values.findAll({
					where: { itemInstanceId: updatedInstance.id },
					transaction: t
				})
			}).then(function(prev) {
				$.prev = prev;
				return models.instance_custom_field_values.destroy({
					where: { itemInstanceId: $.updatedInstance.id },
					transaction: t
				}).then(function(deleted) {
					return instancesUtil.updateCustomFieldsFromReq(req, $.updatedInstance, t, $, $.prev, function() {
						return Logger.logCreateInstance(t, req.user.id, req.body, $.updatedInstance.id)
					})
				})
			})
		}).then(function (result) {
			res.json(rb.success($.newInstanceFullInfo));
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() {
		onManager()
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.delete('/:assetTag', function (req, res, next) {
	function onAdmin() {
		let $ = {};
		db.sequelize.transaction(function (t) {
			// find the instance to be deleted
			return models.item_instances.findOne({
				where: { assetTag: req.params.assetTag },
			}, {transaction: t})
			.then(function(instance){
				$.instance = instance;
				// mark instance as deleted
				return instance.updateAttributes({
					instanceStatus: 'DELETED'
				}, {transaction: t})
			}).then(function(markAsDeleted){
				// find the item to which the instance belong
				return models.items.findOne({
					where: { id: $.instance.itemId },
				}, {transaction: t})
			}).then(function(item){
				// decrement the item quantity by one
				return item.updateAttributes({
					quantity: (item.quantity - 1),
				}, {transaction: t})
			}).then(function(deducted){
				// check if min stock threshold has met
				return ct.checkThreshold(deducted.id, t, function(){
					return Logger.logDeleteInstance(t, req.user.id, $.instance.id)
				});
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onManager() {
		res.status(401).json(rb.unauthorized());
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


module.exports = router
