const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const email = require('../utils/emails');

function _send(userId, subject, content) {
  models.users.findById(userId).then((user) => {
    const toAddr = user.email;
    content = content.replace('request#', user.displayName + '\'s request#');
    email.notifySubscribedManagersAndUser(subject, content, toAddr);
  });
}

const orderEmails = {
  createBundle(userId, bundleId) {
    models.order_bundles.findById(bundleId).then((bundle) => {
      const subject = 'Request Submitted';
      const content = 'request#' + bundleId + ' of type ' + bundle.bundleType
        + ' has been successfully submitted.'
        + ' You can view it in your requests page.';
      _send(userId, subject, content);
    });
  },
  deleteBundle(userId, bundleId) {
    const subject = 'Request Cancelled';
    const content = 'request#' + bundleId
      + ' has been successfully cancelled.'
      + ' You can on longer view it in your requests page.';
    _send(userId, subject, content);
  },
  approveBundle(userId, bundleId) {
    models.order_bundles.findById(bundleId).then((bundle) => {
      const subject = 'Request Approved'
      const content = 'request#' + bundleId
        + ' has been approved for ' + bundle.bundleType
        + '. You can view it in your requests page.';
      _send(userId, subject, content);
    });
  },
  denyBundle(userId, bundleId) {
    const subject = 'Request Denied'
    const content = 'request#' + bundleId
      + ' has been denied. You can view it in your requests page.';
    _send(userId, subject, content);
  },
  dispatchBundle(userId, bundleId) {
    models.order_bundles.findById(bundleId).then((bundle) => {
      const subject = 'Dispatch Received';
      const content = 'A direct dispatch of type ' + bundle.bundleType
        + ' is sent. See request#' + bundleId
        + ' in your requests page. It will appear as an APPROVED request.';
      _send(userId, subject, content);
    });
  },
  returnLoanBundle(userId, bundleId) {
    const subject = 'Loan Returned';
    const content = 'All the items in request#' + bundleId
      + ', which is a LOAN request, have been marked as RETURNED.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  returnLoanOrder(userId, bundleId) {
    const subject = 'Item Returned';
    const content = 'An item in request#' + bundleId
      + ', which is a LOAN request, has been marked as RETURNED.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  convertLoanBundleToDisburse(userId, bundleId) {
    const subject = 'Request Converted To Disbursement';
    const content = 'request#' + bundleId
      + ' , which is a LOAN request, has been converted to a DISBURSE request.'
      + ' Items in this request no longer need to be returned.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  convertLoanOrderToDisburse(userId, bundleId) {
    const subject = 'Item Converted To Disbursement';
    const content = 'An item in request#' + bundleId
      + ' , which is a LOAN request, has been converted to a disbursement.'
      + ' The item no longer needs to be returned.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  submitBackfill(userId, bundleId) {
    const subject = 'Backfill Request Submitted';
    const content = 'Backfill PDF has been successfully submitted'
      + ' for request#' + bundleId + '.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  removeBackfill(userId, bundleId) {
    const subject = 'Backfill Request Removed';
    const content = 'Backfill PDF has been successfully removed'
      + ' for request#' + bundleId + '.'
      + ' You can view it in your requests page.';
    _send(userId, subject, content);
  },
  approveBackfill(userId, bundleId) {
    const subject = 'Backfill Request Approved';
    const content = 'Backfill for request#' + bundleId
      + ' has been approved. You can view it in your requests page.';
    _send(userId, subject, content);
  },
  denyBackfill(userId, bundleId) {
    const subject = 'Backfill Request Denied';
    const content = 'Backfill for request#' + bundleId
      + ' has been denied. You can view it in your requests page.';
    _send(userId, subject, content);
  },
};

module.exports = orderEmails;
