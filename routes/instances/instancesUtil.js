const express = require('express')
const router = express.Router()
const _ = require('lodash')
const models = require('../../models')
const db = require('../../models/index');
const checker = require('../auth/permission')
const pc = require('../utils/permissionChecker')
const rb = require('../utils/resBuilder')
const queryBuilder = require('../utils/queryBuilder')

/**
 * Custom fields and instances are stored in separate tables. This function declare and init
 * custom fields on the given instance. If no value is specified for a custom field, default
 * to null.
 * @param  {Object} instance with only must-have/non-custom fields
 * @param  {Array<Object>} allFields list of all custom fields in form <name, type, visibility>
 * @param  {Array<Object>} filledCustomFields specified field/value pair
 * @param  {Boolean} showPrivate indicates if private fields will be shown
 * @return {Object} populated instances with full information
 */
function populateCustomFieldsOnInstance(instance, allFields, filledCustomFields, showPrivate) {
	allFieldsByName = _.keyBy(allFields, 'name');
	allFields.forEach(function(field) {
		instance[field.name] = null;
	});
	filledCustomFields.forEach(function(element) {
		if (allFieldsByName[element.name].visibility == 'PUBLIC' || showPrivate) {
			instance[element.name] = element.value;
		}
	});
	return instance;
}

/**
 * Update the custom fields of an instance, given a client request whose body contains
 * custom fields in question.
 * @param  {Object} req   client request whose body may constains custom fields and values
 * @param  {Object} instance to be updated with custom fields
 * @param  {Object} t     transaction object of sequelize
 * @param  {Object} $ 		attach references to this object to pass them around
 * @param  {Array<Object>} prev optional array of custom fields with old value before this update
 *                              such that if no new value is specified, the field's value is unchanged
 * @param  {Function} callback optional
 * @return {Promise} an atomic callback to update the custom fields on item
 */
function updateCustomFieldsFromReq(req, instance, t, $, prev, callback) {
	return models.instance_custom_fields.findAll({
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
					itemInstanceId: instance.id,
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
						itemInstanceId: instance.id,
					})
				}
			}
		}
		// if request includes undefined fields, abort
		const DEFAULT_FIELD = ['id', 'itemId', 'assetTag', 'instanceStatus'];
		let abort = false;
		for (let reqField in req.body){
			if (!fieldNames.includes(reqField) && !DEFAULT_FIELD.includes(reqField)) {
				abort = true;
				throw new Error('Cannot create instance whose asset tag is' + req.body.assetTag 
						+ ', due to ill-defined instance custom fields: ' + reqField);
				break;
			}
		}
		if (!abort) {
			return models.instance_custom_field_values.bulkCreate(
				fieldsSpecified, {transaction: t}
			).then(function(filledCustomFields) {
				$.newInstanceFullInfo = populateCustomFieldsOnInstance(
									instance, allFields, filledCustomFields, true);
				return callback();
			})
		}
	})
}

/**
 * Create one single instance from request
 * @param  {Object} req   request
 * @param  {Object} t     sequelize transaction
 * @param  {Object} $ 		scope object, attach variable to it to pass reference
 * @return {Promise}
 */
function createOneInstance(req, t, $, callback) {
	if (!req.body.assetTag)
		req.body.assetTag = Math.floor(Math.random() * 10000000000000000);
	return models.item_instances.findOrCreate({
		where: { assetTag: req.body.assetTag, },
		defaults: {
			itemId: req.params.itemId,
			instanceStatus: req.body.instanceStatus || 'AVAILABLE',
		},
		transaction: t,
	}).spread(function(newInstance, isCreated) {
		$.newInstance = newInstance;
		if (!isCreated) {
			throw new Error('The asset tag ' + req.body.assetTag + ' already exists');
		} else {
			return updateCustomFieldsFromReq(
				req, newInstance.dataValues, t, $, undefined, function(committed) {
					if (callback) callback();
					// return LOG.logCreateinstance(t, req.user.id, $.newInstanceFullInfo, newInstance.id)
				});
		}
	});
}

const external = {
	populateCustomFieldsOnInstance: populateCustomFieldsOnInstance,
	updateCustomFieldsFromReq: updateCustomFieldsFromReq,
	createOneInstance: createOneInstance,
};

module.exports = external;
