const _ = require('lodash');
const models = require('../../models');
const db = require('../../models/index');
const orderENUM = require('../orders/orderENUM');
const orderUtils = require('../orders/orderUtils');
const emails = require('./emails');

const loanReminders = {
  _bundleIdToJobMap: {},
  rescheduleAllReminders() {
    _.each(this._bundleIdToJobMap, (jobs, bundleId) => {
      if (jobs) {
        console.log('Canceling bundleId', bundleId, ', here are all the jobs:');
        console.log(jobs);
        _.each(jobs, (job) => {
          if (job) {
            console.log('Cancel result', job.cancel());
          }
        });
      }
    });
    this._bundleIdToJobMap = {};
    models.reminder_dates.findAll().then((dates) => {
      const dateObjs = _.map(dates, (date) => {
        return new Date(date.date);
      });
      const loanQuery = { where: {
        orderType: orderENUM.LOAN,
        orderStatus: [orderENUM.APPROVED, orderENUM.DISPATCHED],
      }};
      models.orders.findAll(loanQuery).then((rawOrders) => {
        orderUtils.fillNamesForRawOrders({ rawOrders }, (allLoans) => {
          const subject = 'Loan Reminder';
          const groupedLoans = _.groupBy(allLoans, 'bundleId');
          _.forEach(groupedLoans, (loans, bundleId) => {
            // bundleId map to an array of loans that belonging to the bundle
            if (loans && loans.length > 0) {
              const userEmail = loans[0].userEmail;
              let content = 'In request#' + bundleId + '\n';
              _.forEach(loans, (loan) => {
                content += '  Item Name: ' + loan.itemName
                  + ', Quantity: ' + loan.quantity + '\n';
              });
              this._bundleIdToJobMap[bundleId] = [];
              _.forEach(dateObjs, (dateObj) => {
                emails.loanReminderToUserOnDate(
                  subject, content, userEmail, dateObj,
                  { jobMap: this._bundleIdToJobMap, bundleId }
                );
              });
            }
          });
        });
      });
    })
  },

};

module.exports = loanReminders;
