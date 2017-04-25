const logger = require('../utils/logger')

function _read(kv, key) {
	return (kv[key]) ? key + kv[key] : ''
}

function _contentGen(ids, action, params) {
	let content = 'user ' + _read(ids, logger.SRC) + ' ' + action + ' the instance ' + _read(ids, logger.INSTANCE)
	if (params) {
		content += ' with '
		for (let p in params) {
			content += p + ' ' + params[p] + ', '
		}
		content = content.substring(0, content.length - 2)
	}
	return content
}

function _canonicalLog(action, t, srcUserId, params, instanceId, callback) {
	let ids = {
		srcUserId: srcUserId,
		// destUserId: destUserId,
		instanceId: instanceId,
	}
	let content = _contentGen(ids, action, params)
	return logger.log(t, ids, content, callback)
}

const itemsLogger = {
	logCreateInstance: function(t, srcUserId, params, instanceId, callback) {
		return _canonicalLog('created', t, srcUserId, params, instanceId, callback)
	},
	logUpdateInstance: function(t, srcUserId, params, instanceId, callback) {
		return _canonicalLog('updated', t, srcUserId, params, instanceId, callback)
	},
	logDeleteInstance: function(t, srcUserId, instanceId, callback) {
		return _canonicalLog('deleted', t, srcUserId, undefined, instanceId, callback)
	},
}

module.exports = itemsLogger
