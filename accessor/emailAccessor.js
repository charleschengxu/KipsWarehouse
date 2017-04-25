const _ = require('lodash');
const userAccessor = require('./userAccessor');
const configAccessor = require('./configAccessor');
const URL = configAccessor.getUrl();
const API_URL = configAccessor.getApiUrl();

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function _getTemplate(templateName) {
  const emailsURL = API_URL + 'emails/template/' + templateName;
  const response = await fetch(emailsURL, {
    method: 'GET',
    headers: userAccessor.getAuthHeader(),
  });
  const responseJson = await response.json();
  console.log(responseJson);
  return responseJson;
}

async function _postTemplate(templateName, newPreamble) {
  const emailsURL = API_URL + 'emails/template/' + templateName;
  let body = {
    preamble: newPreamble,
  };
  const response = await fetch(emailsURL, {
    method: 'POST',
    headers: userAccessor.getAuthHeader(),
    body: JSON.stringify(body)
  });
  const responseJson = await response.json();
  console.log(responseJson);
  return responseJson;
}


const itemAccessor = {

  _getAuthHeader() {
    return userAccessor.getAuthHeader();
  },
  /**
   * check if a manager/admin is subscribed to the system notification
   * @return {Object} data is true if subscribed
   */
  getSubscriptionStatus: async function() {
    const emailsURL = API_URL + 'emails/subscribe';
    const response = await fetch(emailsURL, {
      method: 'GET',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Subscribe to the system notification. No op if the requesting user is already subscribed.
   * @return {Object} a json response by the server
   */
  subscribe: async function() {
    const emailsURL = API_URL + 'emails/subscribe';
    const response = await fetch(emailsURL, {
      method: 'PUT',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Unsubscribe from the system notification. No op if the requesting user is already unsubscribed.
   * @return {Object} a json response by the server
   */
  unsubscribe: async function() {
    const emailsURL = API_URL + 'emails/subscribe';
    const response = await fetch(emailsURL, {
      method: 'DELETE',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Retrieve the preamble for the **loanReminder** email template
   * @return {Object} a json response by the server
   */
  getLoanReminderTemplate: async function() {
    return _getTemplate('loanReminder');
  },
  /**
   * Update the preamble for the **loanReminder** email template
   * @param  {String} newPreamble used to overwrite the one on server
   * @return {Object} a json response by the server
   */
  updateLoanReminderTemplate: async function(newPreamble) {
    return _postTemplate('loanReminder', newPreamble)
  },
  getSubjectPrefix: async function() {
    return _getTemplate('subjectPrefix');
  },
  updateSubjectPrefix: async function(newPreamble) {
    return _postTemplate('subjectPrefix', newPreamble)
  },
  /**
   * @return {Array<String>} an array of cron date strings
   */
  getAllDatesToSendLoanReminders: async function() {
    const emailsURL = API_URL + 'emails/reminderDate';
    const response = await fetch(emailsURL, {
      method: 'GET',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * No op if date already exists. Assumes cron date string.
   * @return {Object} a json response by the server
   */
  setDateToSendLoanReminders: async function(date) {
    const emailsURL = API_URL + 'emails/reminderDate';
    let body = {
      date: date,
    };
    const response = await fetch(emailsURL, {
      method: 'POST',
      headers: this._getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  removeDateToSendLoanReminders: async function(date) {
    const emailsURL = API_URL + 'emails/reminderDate';
    let body = {
      date: date,
    };
    const response = await fetch(emailsURL, {
      method: 'DELETE',
      headers: this._getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
}

module.exports = itemAccessor;
