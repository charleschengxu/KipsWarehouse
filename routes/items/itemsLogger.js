const logger = require('../utils/logger')

function _read(kv, key) {
	return (kv[key]) ? key + kv[key] : ''
}

function _contentGen(ids, action, params) {
	let content = 'user ' + _read(ids, logger.SRC) + ' ' + action + ' the item ' + _read(ids, logger.ITEM)
	if (params) {
		content += ' with '
		for (let p in params) {
			content += p + ' ' + params[p] + ', '
		}
		content = content.substring(0, content.length - 2)
	}
	return content
}

function _canonicalLog(action, t, srcUserId, params, itemId, callback) {
	let ids = {
		srcUserId: srcUserId,
		// destUserId: destUserId,
		itemId: itemId,
	}
	let content = _contentGen(ids, action, params)
	return logger.log(t, ids, content, callback)
}

const itemsLogger = {
	logCreateItem: function(t, srcUserId, params, itemId, callback) {
		return _canonicalLog('created', t, srcUserId, params, itemId, callback)
	},
	logUpdateItem: function(t, srcUserId, params, itemId, callback) {
		return _canonicalLog('updated', t, srcUserId, params, itemId, callback)
	},
	logDeleteItem: function(t, srcUserId, itemId, callback) {
		return _canonicalLog('deleted', t, srcUserId, undefined, itemId, callback)
	},
	logConvertItemToAssets: function(t, srcUserId, itemId, callback) {
		return _canonicalLog('converted to assets', t, srcUserId, undefined, itemId, callback)
	},
}

module.exports = itemsLogger
