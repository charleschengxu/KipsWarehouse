const email = require('emailjs')
const _ = require('lodash')
const schedule = require('node-schedule');
const models = require('../../models')
const db = require('../../models/index');

const selfAddr = "Kips Warehouse <info@kipswarehouse.com>";

var stage = process.env.stage || 'not_travis';
// retrieve login credential to be authorized on email server
var key;
if (stage == 'travis') {
  key = process.env.key;
} else {
  const config = require(__dirname + '/../../../config/authconfig.json');
  key = config.key;
}
// initialize and cache connection to email server
if (!global.SMTPserver) {
	global.SMTPserver = email.server.connect({
		user: "info@kipswarehouse.com",
		password: key,
		host: "smtp.migadu.com",
		tls: true,
	});
}

function _format(toAddr) {
	if (!toAddr)
		return '';
	return '<' + toAddr + '>, ';
}

function _receiversGen (toAddr, excludeManagers, callback) {
	let ret = '';
	if (!excludeManagers) {
		db.sequelize.transaction(function (t) {
			return models.subscription.findAll({
				attributes: ['userId'],
				transaction: t,
			}).then(function(idBulk){
				let subscriberIds = _.map(idBulk, 'userId');
				return models.users.findAll({
					where: {id: subscriberIds},
					attributes: ['email'],
					transaction: t,
				}).then(function(subscriberEmails){
					let emailAddrs = _.map(subscriberEmails, 'email');
					emailAddrs.forEach(function(addr) {
					  ret += _format(addr);
					});
				})
			})
		}).then(function (result) {
			if (ret != '') ret = ret.substring(0, ret.length - 2)
			if (callback) callback(ret);
		})
	} else if (callback) {
    callback();
	}
}

/**
 * Construct an email with only text content, send it to name and
 * address specified, possibly excluding managers
 * @param  {String} subject         email subject
 * @param  {String} content         email content
 * @param  {Functon} callback       callback handles success case
 * @param  {String} toAddr          user receipient email address
 * @param  {Boolean} excludeManagers true if one does not wish to notify managers
 */
function _send(subject, content, callback, toAddr, excludeManagers) {
	_receiversGen(toAddr, excludeManagers, function(managers) {
		let subjectPrefix;
		db.sequelize.transaction(function(t) {
			return models.email_templates.findOne({
				where: { templateName: 'subjectPrefix' },
				attributes: ['preamble'],
				transaction: t,
			}).then(function(template) {
				subjectPrefix =  template.preamble;
			})
		}).then(function() {
			subject = subjectPrefix + subject;
			SMTPserver.send({
				from: selfAddr,
				to: toAddr || selfAddr,
				bcc: managers,
				subject: subject,
				text: content,
			}, function(err, message) {
				// if (err) throw err; ideally we should throw it and whoever uses it need to catch.
				// but here we just silently mute it and the email won't be sent.
				if (callback) callback(message);
			});
		}).catch(function(err) {
			// throw err;
			// Ideally we should throw it and whoever uses it need to catch.
      // but here we just silently mute it and the email won't be sent.
		})
	})
};

const exteral = {
  /**
	 * callback is called with the message sent
	 */
	notifySubscribedManagers: function(subject, content, callback) {
		_send(subject, content, callback);
	},
	/**
	 * callback is called with the message sent
	 */
	notifySubscribedManagersAndUser: function(subject, content, toAddr, callback) {
		_send(subject, content, callback, toAddr);
	},
	/**
	 * callback is called with the message sent
	 *
	 * Example:
	 * emails.notifyOnlyUser(
	 * 		'Important topic','Jay is a legend', 'cx15@duke.edu',
	 * 		function() { res.json(rb.success('Sent!')) }
	 * )
	 */
	notifyOnlyUser: function(subject, content, toAddr, callback) {
		_send(subject, content, callback, toAddr, true);
	},
	/**
	 * Send a reminder email to user on a given date
	 * For more info, see https://github.com/node-schedule/node-schedule
	 * **CAVEAT** all jobs created are in memory only and NOT durable across server restart
	 *
	 * @param  {String}   subject  email subject
	 * @param  {String}   content  email content
	 * @param  {String}   toAddr   receiver email address
	 * @param  {Date}   	date   a js Date object, e.g 5:30am on March 21, 2012 is
	 *                            		new Date(2012, 2, 21, 5, 30, 0)
	 *                            		notice in js, 0 January, 11 December
	 * @param {Object}    config   an object that holds {jobMap, bundleId} so that
	 *                                jobMap[bundleId] will be filled with the job
	 *                                scheduled, upon which one could call '.cancel()'
	 */
	loanReminderToUserOnDate: function(subject, content, toAddr, date, config) {
		// if (date < Date.now())
		// 	throw new Error('Cannot schedule a job on a date in the past');
		var now = new Date();
		let contentPreamble;
		db.sequelize.transaction(function(t) {
			return models.email_templates.findOne({
				where: { templateName: 'loanReminder' },
				attributes: ['preamble'],
				transaction: t,
			}).then(function(template) {
				contentPreamble = template.preamble;
			});
		}).then(function() {
			content = contentPreamble + '\n' + content;
			config.jobMap[config.bundleId].push(schedule.scheduleJob(date, function(){
				_send(subject, content, undefined, toAddr, true);
			}));
		});
	},
};

module.exports = exteral;
