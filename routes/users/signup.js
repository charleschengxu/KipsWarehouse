const express = require('express');
const router = express.Router();
const models = require('../../models');
const checker = require('../auth/permission')
const pc = require('../utils/permissionChecker');
const rb = require('../utils/resBuilder');
const userCreator = require('./newUserCreator');

router.post('/:username/:password', function(req, res) {
  function onAdmin() {
    models.users.findOne({ //check for existing users with the same name.
      attributes: ['id'],
      where: {
        username: req.params.username
      }
    }).then(function(user) {
      if (user) {//username already existed
        res.status(400).json(
          rb.failure('username already existed', rb.ERROR.DUPLICATE_ENTRY)
        );
      } else {
        const userObject = {
          username: req.params.username,
          displayName: req.body.displayName,
          password: req.params.password,
          email: req.body.email,
          netId: null,
          isNetIdUser: 0,
          permission: req.body.permission,
        };
        const createUserConfig = {
          res: res,
          creatorId: req.user.id,
          signInAfterCreated: false
        };
        userCreator.create(userObject, createUserConfig);
      }
    });
  }
  function onManager() {
    res.json(rb.unauthorized('only admin can create a new user'));
  }
  function onUser() {
    onManager();
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
