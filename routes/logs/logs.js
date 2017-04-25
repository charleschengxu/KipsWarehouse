const express = require('express');
const _ = require('lodash');
const models = require('../../models');
const pc = require('../utils/permissionChecker');
const rb = require('../utils/resBuilder');
const lg = require('../utils/logger')
const queryBuilder = require('../utils/queryBuilder');

const router = express.Router();

function constructQuery(req) {
  const queryUserId = req.query.userId;
  const queryItemId = req.query.itemId;
  const queryFromTime = req.query.fromTime;
  const queryToTime = req.query.toTime;
  const where = {};
  const query = { where };
  queryBuilder.page(query, req.query.rowPerPage, req.query.pageNumber);
  queryBuilder.orderByCreatedAt(query);
  if (queryUserId) {
    where.$or = [{ srcUserId: queryUserId }, { destUserId: queryUserId }];
  }
  if (queryItemId) {
    where.itemId = queryItemId;
  }
  if (queryFromTime || queryToTime) {
    where.createdAt = {};
    if (queryFromTime) {
      where.createdAt.$gt = queryFromTime;
    }
    if (queryToTime) {
      where.createdAt.$lt = queryToTime;
    }
  }
  return query;
}

function getAllUserIds(logs) {
  return _.uniq(
    _.concat(
      _.map(logs, 'srcUserId'),
      _.map(logs, 'destUserId')
    )
  );
}

function getAllItemIds(logs) {
  return _.uniq(_.map(logs, 'itemId'));
}

function getAllBundleIds(logs) {
  return _.uniq(_.map(logs, 'bundleId'));
}

function getAllInstanceIds(logs) {
  return _.uniq(_.map(logs, 'instanceId'));
}

function replaceUserIds(logs, userIdToUser) {
  logs.forEach(log => {
    if (log.srcUserId != null) {
      const srcUserString = lg.SRC + log.srcUserId;
      if (!userIdToUser[log.srcUserId]) {
        log.isValid = false;
      } else {
        log.content = _.replace(
          log.content,
          srcUserString,
          userIdToUser[log.srcUserId].displayName
        );
        log.srcUser = {
          id: log.srcUserId,
          name: userIdToUser[log.srcUserId].displayName
        };
      }
    }
    if (log.destUserId != null) {
      const destUserString = lg.DEST + log.destUserId;
      if (!userIdToUser[log.destUserId]) {
        log.isValid = false;
      } else {
        log.content = _.replace(
          log.content,
          destUserString,
          userIdToUser[log.destUserId].displayName
        );
        log.destUser = {
          id: log.destUserId,
          name: userIdToUser[log.destUserId].displayName
        };
      }
    }
    log.srcUserId = undefined;
    log.destUserId = undefined;
  });
}

function replaceItemIds(logs, itemIdToItem) {
  logs.forEach(log => {
    if (log.itemId != null) {
      if (!itemIdToItem[log.itemId]) {
        log.isValid = false;
      } else {
        const itemString = lg.ITEM + log.itemId;
        log.content = _.replace(
          log.content,
          itemString,
          itemIdToItem[log.itemId].name
        );
        log.item = {
          id: log.itemId,
          name: itemIdToItem[log.itemId].name
        };
      }
    }
    log.itemId = undefined;
  });
}

function replaceBundleIds(logs, bundleIdToBundle) {
  logs.forEach(log => {
    if (log.bundleId != null) {
      if (!bundleIdToBundle[log.bundleId]) {
        log.isValid = false;
      } else {
        const bundleString = lg.BUNDLE + log.bundleId;
        log.content = _.replace(
          log.content,
          bundleString,
          '#' + log.bundleId
        );
        log.bundle = {
          id: log.bundleId,
          name: '#' + log.bundleId
        };
      }
    }
    log.bundleId = undefined;
  });
}

function replaceInstanceIds(logs, insIdToIns) {
  logs.forEach(log => {
    if (log.instanceId != null) {
      if (!insIdToIns[log.instanceId]) {
        log.isValid = false;
      } else {
        const insString = lg.INSTANCE + log.instanceId;
        log.content = _.replace(
          log.content,
          insString,
          insIdToIns[log.instanceId].assetTag
        );
      }
    }
    log.instanceId = undefined;
  });
}

/* GET all the logs */
router.get('/', function(req, res) {
  function onManager() {
    const query = constructQuery(req);
    let logs, userIds, itemIds, bundleIds, instanceIds;
    models.logs.findAll(query).then((logObjects) => {
      logs = _.map(logObjects, (logObj) => {
        const l = logObj.dataValues;
        l.isValid = true;
        return l;
      });
      userIds = getAllUserIds(logs);
      itemIds = getAllItemIds(logs);
      bundleIds = getAllBundleIds(logs);
      instanceIds = getAllInstanceIds(logs);
      return models.users.findAll({ attributes: ['id', 'displayName'], where: { id: userIds } });
    }).then((users) => { // users
      replaceUserIds(logs, _.keyBy(users, 'id'));
      return models.items.findAll({ attributes: ['id', 'name'], where: { id: itemIds } });
    }).then((items) => { // items
      replaceItemIds(logs, _.keyBy(items, 'id'));
      return models.order_bundles.findAll({ attributes: ['id'], where: { id: bundleIds } });
    }).then((bundles) => {
      replaceBundleIds(logs, _.keyBy(bundles, 'id'));
      return models.item_instances.findAll({ attributes: ['id', 'assetTag'], where: { id: instanceIds } });
    }).then((instances) => {
      replaceInstanceIds(logs, _.keyBy(instances, 'id'));
      res.json(rb.success(_.filter(logs, 'isValid')));
    });
  }
  function onAdmin() {
    onManager();
  }
  function onUser() {
    res.status(400).json(rb.unauthorized('Normal users cannot see logs'));
  }
  pc.check(req.user, onAdmin, onManager, onUser);
});

module.exports = router;
