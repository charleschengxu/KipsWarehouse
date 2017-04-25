const express = require('express');
const router = express.Router();
const models = require('../../models')
const db = require('../../models/index')
const rb = require('../utils/resBuilder')
const pc = require('../utils/permissionChecker')
const emails = require('../utils/emails')


router.get('/subscribe', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.subscription.findOne({
				where: { userId: req.user.id },
				transaction: t,
			}).then(function(found) {
				return found;
			})
		}).then(function(result) {
			res.json(rb.success(Boolean(result))) // magic
		}).catch(function(err) {
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
});


router.put('/subscribe', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.subscription.findOrCreate({
				where: { userId: req.user.id },
				transaction: t,
			})//.spread(function(entry, isCreated) {})
		}).then(function(result) {
			res.json(rb.success('You are now subscribed to system notifications.'))
		}).catch(function(err) {
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
});


router.delete('/subscribe', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.subscription.destroy({
				where: { userId: req.user.id },
				transaction: t,
			})//.then(function(deleted) {})
		}).then(function(result) {
			res.json(rb.success('Successfully unsubscribed'))
		}).catch(function(err) {
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
});


router.get('/template/:templateName', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.email_templates.findOne({
				where: { templateName: req.params.templateName },
				transaction: t,
			}).then(function(template) {
				return template;
			})
		}).then(function(result) {
			res.json(rb.success(result))
		}).catch(function(err) {
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


router.post('/template/:templateName', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.email_templates.findOrCreate({
				where: { templateName: req.params.templateName },
				transaction: t,
			}).spread(function(template, isCreated) {
				return template.updateAttributes({
					preamble: req.body.preamble,
				}, {transaction: t}).then(function(updatedTemplate) {
					return updatedTemplate;
				})
			})
		}).then(function(result) {
			res.json(rb.success())
		}).catch(function(err) {
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


router.get('/reminderDate', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.reminder_dates.findAll({
				attributes: ['date'],
				transaction: t,
			}).then(function(found) {
				return found;
			})
		}).then(function(result) {
			res.json(rb.success(result))
		}).catch(function(err) {
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


router.post('/reminderDate', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.reminder_dates.findOrCreate({
				where: { date: req.body.date },
				transaction: t,
			})
			// TODO REBUILD REMINDER JOBS
		}).then(function(result) {
			res.json(rb.success())
		}).catch(function(err) {
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

router.delete('/reminderDate', (req, res) => {
	function onManager() {
		db.sequelize.transaction(function(t) {
			return models.reminder_dates.destroy({
				where: { date: req.body.date },
				transaction: t,
			})
			// TODO REBUILD REMINDER JOBS
		}).then(function(result) {
			res.json(rb.success())
		}).catch(function(err) {
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

module.exports = router;
