const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.sendFile('index.html');
});

router.get('/docs', (req, res) => {
  res.sendFile('apidocs.html', { root: __dirname });
});

module.exports = router;
