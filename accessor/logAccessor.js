const queryString = require('query-string');
const configAccessor = require('./configAccessor');
const userAccessor = require('./userAccessor');

const API_URL = configAccessor.getApiUrl();
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const logAccessor = {
  _getAuthHeader() {
    return userAccessor.getAuthHeader();
  },
  /**
   * @param  {Object}  query
   *  {itemId, userId,
   *   fromTime // js Date() object,
   *   toTime // js Date() object),
   *   rowPerPage, pageNumber}
   */
  async getLogsByQueryAsync(query) {
    let getLogUrl = API_URL + 'logs/';
    if (query) {
      const queryParams = {
        itemId: query.itemId || undefined,
        userId: query.userId || undefined,
        fromTime: query.fromTime || undefined,
        toTime: query.toTime || undefined,
        rowPerPage: query.rowPerPage || undefined,
        pageNumber: query.pageNumber || undefined,
      };
      getLogUrl += '?' + queryString.stringify(queryParams);
    }
    console.log('getLogUrl: ', getLogUrl);
    const response = await fetch(getLogUrl, {
      method: 'GET',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
};

module.exports = logAccessor;
