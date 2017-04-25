const models = require('../../models')
const db = require('../../models/index')
const emails = require('./emails')

/**
 * Must return this call AND supply a callback due to the mix
 * of promises and callbacks. :(
 *
 * e.g.
 * return ct.checkThreshold(itemId, t, function(){
 * 		// execute hereon after email sent
 * })；
 */
function checkThreshold(itemId, t, callback) {
	return models.items.findOne({
		where: { id: itemId },
		transaction: t,
	})
	.then(function(item) {
		if (item.threshold && item.quantity <= item.threshold) {
			emails.notifySubscribedManagers(
				'Restock Warning',
				'The available quantity of item ' + item.name + ' has reached or fallen below threshold.',
				callback);
		} else {
			if (callback) return callback();
		}
	})
}

function checkThresholds($) {
	function checkAndSend(itemIds) {
		models.items.findAll({ where: { id: itemIds } }).then((items) => {
			_.each(items, (item) => {
				if (item.threshold && item.quantity <= item.threshold) {
					emails.notifySubscribedManagers(
						'Restock Warning',
						'The available quantity of item ' + item.name + ' has reached or fallen below threshold.'
					);
				}
			});
		});
	}
	if ($.itemIds) {
		checkAndSend($.itemIds);
	} else if ($.bundleId) {
		models.orders.findAll({
			attributes: ['itemId'],
			where: { bundleId: $.bundleId },
		}).then((orders) => {
			const itemIds = _.map(orders, 'itemId');
			checkAndSend(itemIds);
		});
	}
}


const external = {
	checkThreshold,
	checkThresholds,
};

module.exports = external;
