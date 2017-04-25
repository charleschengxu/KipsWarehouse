const express = require('express');
const router = express.Router();
const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const pc = require('../utils/permissionChecker');
const rb = require('../utils/resBuilder');

/* GET all the tags */
router.get('/', function(req, res) {
  models.tags.findAll().then(function(tags) {
    res.json(rb.success(tags));
  });
});

/* Create tags if not existing */
router.post('/', function(req, res) {
  function onManager() {
    const tags = req.body.tags;
    if (!tags || !Array.isArray(tags) || tags.length < 1) {
      res.json(
        rb.failure('syntax error. body.tags need to be a non-empty array')
      );
    } {
      uniqNames = _.uniq(tags);
      models.tags.findAll({where: {name: uniqNames}}).then(function(existingTags) {
        existingNames = _.map(existingTags, 'name');
        nonExistingNames = _.filter(uniqNames, name =>
          _.indexOf(existingNames, name) == -1
        );
        tagsToBeCreated = _.map(nonExistingNames, name => {return {name: name};});
        //tagsToBeCreated is what we need to create.
        models.tags.bulkCreate(tagsToBeCreated).then(function() {
          res.json(rb.success());
        });
      });
    }
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.json(rb.unauthorized());
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

/* POST a new tag */
router.post('/:name', function(req, res) {
  function onSuccess() {
    models.tags.findOne({ //check for existing tags with the same name.
      attributes: ['id'],
      where: {
        name: req.params.name
      }
    }).then(function(tag) {
      if (tag) {//tag with the same name already existed
        res.status(400).json({
          status: 'error',
          error: 'tag name already existed',
          data: null
        });
      } else {
        models.tags.build({
          name: req.params.name,
          description: req.body.description || null
        }).save().then(function(newTag) {
          res.json({
            status: 'success',
            error: null,
            data: newTag
          });
        }).catch(function(error) {
          res.json({
            status: 'error',
            error: error,
            data: null
          });
        });
      }
    });
  }
  function onFail() {
    res.json({
      status: 'error',
      error: 'only admin can create a new tag',
      data: null
    });
  }
  //checker(req.user.id, onSuccess, onFail);
  res.status(400).json(rb.failure('Deprecated by Jay'));
});

/* PUT update an existing tag */
router.put('/:tagId', function(req, res) {
  function onSuccess() {
    const tagId = req.params.tagId;
    models.tags.findById(tagId).then(function(tag) {
      if (!tag) { //no tag with tagId
        res.status(400).json({
          status: 'error',
          error: 'no tag with tagId ' + tagId + ' is found',
          data: null
        });
      } else {
        let fields = [];
        //name field
        if (req.body.name) {
          tag.name = req.body.name;
          fields.push('name');
        }
        //description field
        if (req.body.description) {
          tag.description = req.body.description;
          fields.push('description');
        }

        if (fields.length == 0) {
          res.status(400).json({
            status: 'error',
            error: 'nothing to update for tag with id ' + tagId,
            data: null
          });
        } else {
          tag.save({fields: fields}).then(function(updatedTag) {
            res.json({
              status: 'success',
              error: null,
              data: updatedTag
            });
          }).catch(function(error) {
            res.json({
              status: 'error',
              error: error,
              data: null
            });
          });
        }
    }});
  }
  function onFail() {
    res.json({
      status: 'error',
      error: 'only admin can update a tag',
      data: null
    });
  }
  //checker(req.user.id, onSuccess, onFail);
  res.status(400).json(rb.failure('Deprecated by Jay'));
});

/* DELETE an existing tag */
router.delete('/:tagId', function (req, res) {
  function onManager() {
    const tagId = req.params.tagId;
    models.tags.findById(tagId).then(function(tag) {
      if (!tag) { //no tag with tagId, success by default.
        res.json(rb.success());
      } else {
        db.sequelize.transaction(function (t) {
          return tag.destroy({transaction: t}).then(function (tag) {
            return models.item_tag_pairs.destroy({
              where: {tagId: tagId},
              transaction: t
            });
          });
        }).then(function (result) {
          res.json(rb.success());
        }).catch(function (error) {
          res.status(400).json(rb.failure(error.message), rb.ERROR.TRANSACTION_ERR);
        });
      }
    });
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.json(rb.unauthorized('normal user cannot delete a tag'));
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
