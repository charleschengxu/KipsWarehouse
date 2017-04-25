var canonical = {
	CREATE : 'create',
	UPDATE : 'update',
	DELETE : 'delete',
}

const models = {
	items: {
		name: 'an item',
	},
	customFields: {
		name: 'a custom field',
	},
	orders: {},
	users: {},
	tags: {},
	login: {},
}

/**
 * Enumeration of all actions that a user/subject could initiate.
 * CREATE, UPDATE, DELETE are canonical actions that could be applied
 * on all model/object. 
 *
 * actionEnum = {
 *	 items: {
 *	 	 CREATE : 'create an item',
 *	   UPDATE : 'update an item',
 *		 DELETE : 'delete an item',
 *	 },
 *	 customFields: {
 *		 CREATE : 'create a custom field',
 *	   UPDATE : 'update a custom field',
 *		 DELETE : 'delete a custom field',
 *	 },
 *	 ...
 * }
 * 
 * @type {Object}
 */
var actionEnum = {}
for (let model in models) {
	actionEnum[model] = {}
	for (let action in canonical) {
		actionEnum[model][action] = canonical[action] + ' ' + actionEnum[model].name
	}
}

module.exports = actionEnum
