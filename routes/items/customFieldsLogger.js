const logger = require('../utils/logger')

function _read(kv, key) {
	return (kv[key]) ? key + kv[key] : ''
}

function _contentGen(ids, action, fieldName, params) {
	let content = 'user ' + _read(ids, logger.SRC) + ' ' + action + ' the custom field ' + fieldName
	if (params) {
		content += ' with '
		for (let p in params) {
			content += p + ' ' + params[p] + ', '
		}
		content = content.substring(0, content.length - 2)
	}
	return content
}

function _canonicalLog(action, t, srcUserId, fname, params, callback) {
	let ids = {
		srcUserId: srcUserId,
	}
	let content = _contentGen(ids, action, fname, params)
	return logger.log(t, ids, content, callback)
}

const customFieldsLogger = {
	logCreateCustomField: function(t, srcUserId, name, type, visibility, callback) {
		let params = {
			type: type,
			visibility: visibility,
		}
		return _canonicalLog('created', t, srcUserId, name, params, callback)
	},
	logUpdateCustomField: function(t, srcUserId, name, visibility, callback) {
		let params = {
			visibility: visibility,
		}
		return _canonicalLog('updated', t, srcUserId, name, params, callback)
	},
	logDeleteCustomField: function(t, srcUserId, name, callback) {
		return _canonicalLog('deleted', t, srcUserId, name, undefined, callback)
	},
}

module.exports = customFieldsLogger
