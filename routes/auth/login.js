const express = require('express');
const router = express.Router();
const models = require('../../models');
const bcrypt = require('bcryptjs');
const auth = require('./auth');
const rb = require('../utils/resBuilder');
const db = require('../../models/index');
const fetch = require('node-fetch');
const userCreator = require('../users/newUserCreator');
const NETID_URL = 'https://api.colab.duke.edu/identity/v1/';
const CLIENT_ID = 'kipswarehouse';

function loginWithToken(req, res) {
  fetch(NETID_URL, {
    method: 'GET',
    headers: {
      'Accept': "application/json",
      'x-api-key': CLIENT_ID,
      'Authorization': 'Bearer ' + req.body.accessToken
    }
  }).then(function(fetchRes) {
    return fetchRes.json();
  }).then(function (fetchResJson) {
    if (!fetchResJson.netid) {
      res.json(rb.failure('Token login failed'));
    } else {
      models.users.findOne({where: {
        netId: fetchResJson.netid,
        isNetIdUser: 1
      }}).then(function(existingNetIdUser) {
        if (existingNetIdUser) {
          let u = existingNetIdUser.dataValues;
          u.password = undefined;
          u.token = auth.generateJWT(u.id);
          res.json(rb.success(u));
        } else {//create new netId user
          let userObject = {
            username: fetchResJson.netid + '_NET_ID_USER',
            displayName: fetchResJson.displayName,
            password: null,
            email: fetchResJson.mail,
            netId: fetchResJson.netid,
            isNetIdUser: 1,
            permission: 'USER',
          };
          const createUserConfig = {
            res: res,
            signInAfterCreated: true
          };
          userCreator.create(userObject, createUserConfig);
        }
      });
    }
  });
}

function loginWithCredentials(req, res) {
  models.users.findOne({
    where: {username: req.body.username}
  }).then(function(user) {
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      let u = user.dataValues;
      u.password = undefined;
      u.token = auth.generateJWT(user.id);
      res.json(rb.success(u));
    } else {
      res.status(401).json(
        rb.failure('Incorrect username or password', rb.ERROR.WRONG_CREDENTIALS)
      );
    }
  });
}

router.post('/', function(req, res) {
  if (req.body.username && req.body.password) {
    loginWithCredentials(req, res);
  } else if (req.body.accessToken) {
    loginWithToken(req, res);
  } else {
    res.status(401).json(
      rb.failure('Not enough information to login in login request body')
    );
  }
});

module.exports = router;
