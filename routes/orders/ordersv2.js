const express = require('express');
const router = express.Router();

router.use('/', require('./orderGET'));
router.use('/', require('./orderPOST'));
router.use('/', require('./orderPUT'));
router.use('/', require('./orderDELETE'));

module.exports = router;
