const express = require('express')
const router = express.Router()
const fetch = require('node-fetch');
const fs = require('fs')
const jsonlint = require('jsonlint')
const _ = require('lodash')
const models = require('../../models')
const db = require('../../models/index');
const customFields = require('./customFields.js')
const checker = require('../auth/permission')
const pc = require('../utils/permissionChecker')
const rb = require('../utils/resBuilder')
const ct = require('../utils/checkThreshold')
const queryBuilder = require('../utils/queryBuilder')
const LOG = require('./itemsLogger')
const instancesUtil = require('../instances/instancesUtil')
const InstanceLogger = require('../instances/instancesLogger')


/**
 * Custom fields on further routes
 */
router.use('/customFields', customFields)

/**
 * Custom fields and items are stored in separate tables. This function declare and init
 * custom fields on the given item. If no value is specified for a custom field, default
 * to null.
 * @param  {Object} item with only must-have/non-custom fields
 * @param  {Array<Object>} allFields list of all custom fields in form <name, type, visibility>
 * @param  {Array<Object>} filledCustomFields specified field/value pair
 * @param  {Boolean} showPrivate indicates if private fields will be shown
 * @return {Object} populated items with full information
 */
function populateCustomFieldsOnItem(item, allFields, filledCustomFields, showPrivate) {
	allFieldsByName = _.keyBy(allFields, 'name')
	allFields.forEach(function(field) {
		item[field.name] = null
	})
	filledCustomFields.forEach(function(element) {
		if (allFieldsByName[element.name].visibility == 'PUBLIC' || showPrivate) {
			item[element.name] = element.value
		}
	});
	return item
}

/**
 * @param  {Object} bulkyItem item object that comes with a lot of other shit
 * @return {Object} a mutable item object with the only non-custom fields
 */
function buildItem(bulkyItem) {
	return {
		id: bulkyItem.id,
		name: bulkyItem.name,
		quantity: bulkyItem.quantity,
		model: bulkyItem.model,
		description: bulkyItem.description,
		itemStatus: bulkyItem.itemStatus,
		isAsset: bulkyItem.isAsset,
		threshold: bulkyItem.threshold,
	}
}

/**
 * Update the custom fields of an item, given a client request whose body contains
 * custom fields in question.
 * @param  {Object} req   client request whose body may constains custom fields and values
 * @param  {Object} item  potentially bulky item to be updated with custom fields
 * @param  {Object} t     transaction object of sequelize
 * @param  {Object} scope attach references to this object to pass them around
 * @param  {Array<Object>} prev optional array of custom fields with old value before this update
 *                              such that if no new value is specified, the field's value is unchanged
 * @param  {Function} callback optional
 * @return {Promise} an atomic callback to update the custom fields on item
 */
function updateCustomFieldsFromReq(req, item, t, scope, prev, callback) {
	return models.custom_fields.findAll({
		attributes: ['name', 'type', 'visibility'],
		transaction: t,
	}).then(function(allFields) {
		let fieldNames = _.map(allFields, 'name')
		fieldsSpecified = []
		fieldNames.forEach(function(customField) {
			if (typeof req.body[customField] !== 'undefined') {
				fieldsSpecified.push({
					name: customField,
					value: req.body[customField],
					itemId: item.id,
				})
			}
		})
		if (prev) {
			let oldValuesByName = _.keyBy(prev, 'name')
			let listNameOfUpdatedFields = _.map(fieldsSpecified, 'name')
			for (let n in oldValuesByName) {
				if (!listNameOfUpdatedFields.includes(n)) {
					fieldsSpecified.push({
						name: oldValuesByName[n].name,
						value: oldValuesByName[n].value,
						itemId: item.id,
					})
				}
			}
		}
		// if request includes undefined fields, abort
		const DEFAULT_FIELD = ['id', 'name', 'quantity', 'itemStatus', 'model', 'description', 'tags', 'comment', 'isAsset', 'threshold']
		let abort = false;
		for (let reqField in req.body){
			if (!fieldNames.includes(reqField) && !DEFAULT_FIELD.includes(reqField)) {
				abort = true;
				let name = req.params.itemName || req.body.name
				throw new Error('Cannot create ' + name + ' with ill-defined custom fields: ' + reqField);
				break;
			}
		}
		if (!abort) {
			return models.custom_field_values.bulkCreate(
				fieldsSpecified, {transaction: t}
			).then(function(filledCustomFields) {
				scope.newItemFullInfo = populateCustomFieldsOnItem(
									buildItem(item), allFields, filledCustomFields, true);
				return callback()
			})
		}
	})
}


/**
 * Find tags that match the where condition on tags table, then find all items
 * that contain at least one tag in the selected tags.
 * @param  {Object}   where    query object on tags table
 * @param  {Object}   t        sequelize transaction
 * @param  {Function} callback procedure to handle the selected item ids
 * @return {Promise}           process the selected item ids and return that result of
 *                                     the callback function
 */
function findItemIdsByTags(where, t, callback) {
	return models.tags.findAll({
			include: [{ model: models.item_tag_pairs, }],
			where: where,
			transaction: t,
		}).then(function(tags) {
			let itemIdSet = {}, DUMMY = 'kips'
			tags.forEach(function(tag) {
				tag.item_tag_pairs.forEach(function(pair) {
					itemIdSet[pair.itemId] = DUMMY
				})
			})
			let selectedItemIds = _.keysIn(itemIdSet)
			return callback(selectedItemIds)
		})
}

router.get('/', function (req, res, next) {
	function _get(showPrivate) {
		const targetId = Number(req.query.id)
		const itemName = req.query.name
		const itemModel = req.query.model
		let tagWhere, ret = []
		if (req.query.includeTags || req.query.excludeTags) {
			tagWhere = { name: {} }
			if (req.query.includeTags)
				tagWhere.name.$in = JSON.parse(req.query.includeTags)
			if (req.query.excludeTags && JSON.parse(req.query.excludeTags).length > 0)
				tagWhere.name.$notIn = JSON.parse(req.query.excludeTags)
		}
		db.sequelize.transaction(function (t) {
			// find tags that match include and exclude condition
			return findItemIdsByTags(tagWhere, t, function(selectedItemIds) {
				let excludeWhere = {name: (req.query.excludeTags) ? JSON.parse(req.query.excludeTags) : []}
				// find tags to be excluded so that if an item has multiple tags in which one tag matches
				// exclude condition, must NOT return that item
				return findItemIdsByTags(excludeWhere, t, function(excludedItemIds) {
					// construct query on items table
					let query = {
						where: (tagWhere)? { id: {$in: selectedItemIds} } : {},
						order: [['name', 'ASC']],
						include: [{
							model: models.item_tag_pairs,
							include: [{ model: models.tags }]
						}],
						transaction: t,
					}
					if (excludedItemIds.length > 0) query.where.id.$notIn = excludedItemIds
					if (itemName || itemModel) {
						if (itemName && itemModel) {
							query.where.$or = [
								{name: { $like: '%' + itemName + '%' }},
								{model: { $like: '%' + itemModel + '%' }}
							];
						} else if (itemName) {
							query.where.name = { $like: '%' + itemName + '%' }
						} else {
							query.where.model = { $like: '%' + itemModel + '%' }
						}
					}
					queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
					return models.items.findAll(query).then(function(items) {
						return models.items.findAll({
							include: [{ model: models.item_tag_pairs, }],
							transaction: t,
						}).then(function(secondPass) {
							// add back items with no tags
							if (req.query.excludeTags && JSON.parse(req.query.excludeTags).length > 0 && !req.query.includeTags) {
								for (let it of secondPass) {
									if (it.item_tag_pairs.length == 0) {
										items.push(it)
									}
								}
							}
							// fits API object specification
							let transformed = _.map(items, function(item) {
								let it = buildItem(item)
								it.tags = _.map(item.item_tag_pairs, function(tag) {
									return tag.tag.name;
								})
								return it
							})
							// add custom fields onto each items
							let itemNoFieldsById = _.keyBy(transformed, 'id')
							return models.items.findAll({
								include: [{ model: models.custom_field_values }],
								transaction: t,
							}).then(function(itemFields) {
								return models.custom_fields.findAll({
									attributes: ['name', 'type', 'visibility'],
									transaction: t,
								}).then(function(allFields) {
									let itemFieldsById = _.keyBy(itemFields, 'id')
									for (let iid in itemNoFieldsById) {
										itemNoFieldsById[iid] = populateCustomFieldsOnItem(
											itemNoFieldsById[iid], allFields, itemFieldsById[iid].custom_field_values, showPrivate)
									}
									ret = _.values(itemNoFieldsById)
									// if request specifies an id, find it in the final results
									if (targetId) {
										idToFoundItems = _.keyBy(ret, 'id')
										ret = [ idToFoundItems[targetId] ]
									}
								})
							})
						})
			  	})
		  	})
			})
		}).then(function (result) {
			res.json(rb.success(ret))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}

	function onManager() { _get(true) }
	function onAdmin() { _get(true) }
	function onNormalUser() { _get(false) }

	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.post('/getItemsAndInstances', function (req, res, next) {
	let ret = [];
	db.sequelize.transaction(function(t) {
		return models.items.findAll({
				where: { id: req.body.itemIds },
				transaction: t,
			}).then(function(items) {
				return db.sequelize.Promise.each(items, function(item) {
					let element = {
						itemId: item.id,
						itemName: item.name,
						instances: [],
					};
					ret.push(element);
					console.log(item);
					if (item.isAsset) {
						return models.item_instances.findAll({
							where: {
								itemId: item.id,
								instanceStatus: 'AVAILABLE',
							},
							transaction: t,
						}).then(function(instances) {
							element.instances = _.map(instances, (i) => {
									return {
										instanceId: i.id,
										assetTag: i.assetTag,
										instanceStatus: i.instanceStatus,
									}
								})
						})
					}
				})
			})
	}).then(function(result) {
		res.json(rb.success(ret))
	}).catch(function(err) {
		res.status(400).json(rb.failure(err.message));
	})
})


/**
 * Create one single item from request
 * @param  {Object} req   request
 * @param  {Object} t     sequelize transaction
 * @param  {Object} scope attach variable to this object to pass reference
 * @param  {Funciton} callback     called after execution done
 * @return {Promise}
 */
function createOneItem(req, t, scope, callback) {
	if (Number(req.params.quantity) < 0)
		throw new Error('Cannot create ' + req.params.itemName + ' with negative quantity');
	return models.items.findOrCreate({
		where: { name: req.params.itemName },
		defaults: {
			quantity: req.params.quantity,
			itemStatus: req.body.itemStatus || 'ACTIVE',
			model: req.body.model,
			description: req.body.description,
			isAsset: req.body.isAsset,
		},
		transaction: t,
	}).spread(function(newItem, isCreated) {
		if (!isCreated) {
			throw new Error(req.params.itemName + ' already exists');
		} else {
			scope.newItem = newItem;
			return models.tags.findAll({
				where: { name: req.body.tags },
				attributes: ['id'],
				transaction: t
			}).then(function(selectedTagIds) {
				if (req.body.tags && selectedTagIds.length != req.body.tags.length) {
					throw new Error('Cannot create ' + req.params.itemName + ' with ill-defined tag(s)');
				}
				return models.item_tag_pairs.bulkCreate(
					_.map(selectedTagIds, function(tag) {
						return {
							tagId: tag.id,
							itemId: newItem.id
						};
					}), { transaction: t}
				).then(function(createTags) {
					return updateCustomFieldsFromReq(req, newItem, t, scope, undefined,
						function(committed) {
							return LOG.logCreateItem(t, req.user.id, scope.newItemFullInfo, newItem.id, callback)
						})
				})
			});
		}
	})
}


router.put('/:itemId', function (req, res, next) {
	function onManager() {
		let scope = { newItemFullInfo: null }
		db.sequelize.transaction(function (t) {
			return models.items.findOne({
				where: {id: req.params.itemId},
			}, {transaction: t}).then(function(oldItem){
				let newQuantity;
				const quantityChanged =
					!isNaN(req.body.quantity) && Number(req.body.quantity) != Number(oldItem.quantity);
				if (quantityChanged) {
					newQuantity = Number(req.body.quantity)
					if (oldItem.isAsset || req.body.isAsset)
						throw new Error('Cannot directly change the quantity of an asset-based item. Must specify instances.');
				}
				return oldItem.updateAttributes({
					name: req.body.name || oldItem.name,
					quantity: quantityChanged ? Number(req.body.quantity) : oldItem.quantity,
					model:
						(typeof req.body.model !== 'undefined') ?
							req.body.model : oldItem.model,
					description:
						(typeof req.body.description !== 'undefined') ?
							req.body.description : oldItem.description,
					itemStatus: req.body.itemStatus || oldItem.itemStatus,
				}, {transaction: t}).then(function(updatedItem) {
					return models.tags.findAll({
						where: {name: req.body.tags},
						attributes: ['id'],
						transaction: t
					}).then(function(selectedTagIds){
						// delete then create to serve as update
						return models.item_tag_pairs.destroy({
							where: {
								itemId: Number(req.params.itemId)
							},
							transaction: t
						}).then(function(deleted){
							return models.item_tag_pairs.bulkCreate(
								_.map(selectedTagIds, function(tag) {
									return {
										tagId: Number(tag.id),
										itemId: Number(req.params.itemId)
									};
								}),
								{transaction: t}
							).then(function(pairs){
								return models.custom_field_values.findAll({
									where: { itemId: Number(req.params.itemId) },
									transaction: t
								}).then(function(prev) {
									return models.custom_field_values.destroy({
										where: { itemId: Number(req.params.itemId) },
										transaction: t
									}).then(function(deleted) {
										return updateCustomFieldsFromReq(req, updatedItem, t, scope, prev, function() {
											return LOG.logUpdateItem(t, req.user.id, scope.newItemFullInfo, req.params.itemId)
										})
									})
								})
							})
						})
					})
				})
			})
		}).then(function (result) {
			res.json(rb.success(scope.newItemFullInfo));
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message))
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.put('/:itemId/:quantityDelta', function (req, res, next) {
	function onManager() {
		let updatedItemData
		db.sequelize.transaction(function (t) {
			return models.items.findOne({
				where: {id: req.params.itemId},
			}, {transaction: t}).then(function(oldItem){
				let quantityDelta = Number(req.params.quantityDelta)
				let newQuantity = quantityDelta + Number(oldItem.quantity)
				return oldItem.updateAttributes(
					{quantity: newQuantity},
					{transaction: t}
				).then(function(updatedItem) {
					updatedItemData = updatedItem
					return LOG.logUpdateItem(t, req.user.id, {quantity: newQuantity}, req.params.itemId)
				})
			})
		}).then(function (result) {
			res.json(rb.success(updatedItemData))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err))
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.delete('/:itemId', function (req, res, next) {
	function onAdmin() {
		db.sequelize.transaction(function (t) {
			// delete the item itself
			return models.items.destroy({
				where: { id: Number(req.params.itemId) },
				transaction: t
			}).then(function(){
				// delete its association with tags
				return models.item_tag_pairs.destroy({
					where: { itemId: Number(req.params.itemId) },
					transaction: t
				}).then(function(pairs){
					// delete all custom fields on this item
					return models.custom_field_values.destroy({
						where: { itemId: Number(req.params.itemId) },
						transaction: t
					}).then(function(fields){
						// delete all historical orders on such items
						return models.orders.destroy({
							where: { itemId: Number(req.params.itemId) },
							transaction: t
						}).then(function(destroyed){
							return models.item_instances.findAll({
								where: { itemId: Number(req.params.itemId) },
								transaction: t,
							}).then(function(instances){
								// mark all its instances as DELETED
								return db.sequelize.Promise.each(instances, function(i) {
									return i.updateAttributes({
										instanceStatus: 'DELETED'
									}, {transaction: t})
								})
							}).then(function(done){
								return LOG.logDeleteItem(t, req.user.id, req.params.itemId)
							})
						})
					})
				})
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message))
		})
	}
	function onManager() {
		res.status(401).json(rb.unauthorized('Must be admin to delete item'));
	}
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


function convertToAsset(req, item, t, $, callback) {
	// $.item = $.newItem;
	return item.updateAttributes({
		isAsset: 1,
	}, { transaction: t })
	.then(function(updatedItem) {
		let instances = new Array(Number(item.quantity));
		for (let i = 0; i < instances.length; i++) {
			instances[i] = {
				assetTag: Math.floor(Math.random() * 10000000000000000),
				itemId: item.id,
				instanceStatus: 'AVAILABLE',
			}
		}
		return models.item_instances.bulkCreate(
			instances, {transaction: t}
		).then(function(filledCustomFields) {
			return LOG.logConvertItemToAssets(t, req.user.id, item.id)
		}).then(function(done) {
			if (callback) callback();
		})
	})
}


router.post('/:itemName/:quantity', function (req, res, next) {
	function onManager() {
		let scope = { newItemFullInfo: null }
		db.sequelize.transaction(function (t) {
			return createOneItem(req, t, scope) // also logged this transaction
			.then(function() {
				if (req.body.isAsset) {
					return convertToAsset(req, scope.newItem, t, scope, function() {})
				}
			})
		}).then(function (result) {
			res.json(rb.success(scope.newItemFullInfo))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.post('/convertToAsset', function (req, res, next) {
	function onManager() {
		let $ = {};
		db.sequelize.transaction(function (t) {
			return models.items.findOne({
				where: { id: req.body.itemId },
			}, {transaction: t})
			.then(function(item){
				return convertToAsset(req, item, t, $);
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})


router.post('/import', function (req, res, next) {
	function onAdmin() {
		const url = 'https://www.filestackapi.com/api/file/' + req.body.fileHandle;
		fetch(url, {
			method: 'GET',
		}).then(function(response) {
			return response.text().then(function(blob) {
				let itemsToImport;
				try {
			    itemsToImport = jsonlint.parse(blob);
			  } catch (e) {
			    res.status(400).json(rb.failure('Not a valid JSON file: ' + e.message));
			    return;
			  }
				db.sequelize.transaction(function (t) {
					return db.sequelize.Promise.each(itemsToImport, function(item) {
						let request = {
							params: {
								itemName: item.name,
								quantity: item.quantity,
							},
							body: {},
							user: req.user,
						}
						for (let k in item) {
							if (k != 'name' && k != 'quantity' && k != 'instances')
								request.body[k] = item[k]
						}
						let $ = {};
						return createOneItem(request, t, $, function() {
							if (item.isAsset) {
								if (item.instances) {
									// instances defined by client, senity check
									if (item.instances.length != item.quantity)
										throw new Error('On ' + item.name + ', number of instances does not agree with item quantity.');
									return db.sequelize.Promise.each(item.instances, function(instance) {
										let instanceRequest = {
											body: instance,
											params: {itemId: $.newItem.id}
										};
										return instancesUtil.createOneInstance(instanceRequest, t, {})
									})
								} else {
									// no instances specified, create all instances using random assetTags
									return convertToAsset(req, $.newItem, t, $);
								}
							}
						})
					})
				}).then(function (result) {
					res.json(rb.success('Successfully imported all items in the uploaded file'))
				}).catch(function (err) {
					res.status(400).json(rb.failure(err.message));
				})
			})
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


router.post('/threshold', function (req, res, next) {
	function onManager() {
		let where = { id: {} };
		if (req.body.invertSelection) {
			where.id.$notIn = req.body.itemIds;
		} else {
			where.id.$in = req.body.itemIds;
		}
		db.sequelize.transaction(function (t) {
			if (Number(req.body.threshold) < 0)
				throw new Error('Threshold cannot be negative');
			return models.items.findAll({
				where: where,
				transaction: t,
			})
			.then(function(items) {
				return db.sequelize.Promise.each(items, function(item) {
					return item.updateAttributes({
						threshold: req.body.threshold,
					}, {transaction: t})
					.then(function(updatedItem) {
						return ct.checkThreshold(item.id, t, function(){
							return LOG.logUpdateItem(t, req.user.id, {threshold: req.body.threshold}, item.id);
						});
					})
				})
			})
		}).then(function (result) {
			res.json(rb.success())
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})

router.get('/threshold', function (req, res, next) {
	function onManager() {
		db.sequelize.transaction(function (t) {
			return models.items.findAll({
				transaction: t,
			})
		}).then(function (items) {
			// filtering after transaction to prevent holding locks for too long
			let ret = [];
			items.forEach(function(item) {
				if (item.quantity <= item.threshold) {
					ret.push(item);
				}
			})
			res.json(rb.success(ret))
		}).catch(function (err) {
			res.status(400).json(rb.failure(err.message));
		})
	}
	function onAdmin() { onManager() }
	function onNormalUser() {
		res.status(401).json(rb.unauthorized());
	}
	pc.check(req.user, onAdmin, onManager, onNormalUser);
})

module.exports = router
