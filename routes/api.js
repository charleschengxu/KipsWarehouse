const express = require('express');
const passport = require('passport');
const users = require('./users/users');
const items = require('./items/items');
const tags = require('./tags/tags');
const ordersv2 = require('./orders/ordersv2');
const backfills = require('./backfills/backfills');
const loans = require('./loans/loans');
const logs = require('./logs/logs');
const emails = require('./emails/emails');
const instances = require('./instances/instances');

const router = express.Router();

router.use('/', passport.authenticate(
  'jwt', { session: false }
), (req, res, next) => {
  console.log(`Authenticated user id: ${req.user.id}`);
  next();
});

router.use('/users', users);
router.use('/items', items);
router.use('/tags', tags);
router.use('/ordersv2', ordersv2);
router.use('/loans', loans);
router.use('/backfills', backfills);
router.use('/logs', logs);
router.use('/emails', emails);
router.use('/instances', instances);

router.get('/hello', (req, res) => {
  res.send('hello');
});

router.get('/whosyourdaddy', (req, res) => {
  res.send('Jay');
});

module.exports = router;
