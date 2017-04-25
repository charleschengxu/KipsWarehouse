const configAccessor = require('./configAccessor');
const userAccessor = require('./userAccessor');

const API_URL = configAccessor.getApiUrl();
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const tagAccessor = {
  _getAuthHeader() {
    return userAccessor.getAuthHeader();
  },
  /**
   * @param {string} tagName
   */
  async createTagAsync(tagName) {
    return this.createTagsIfNotExistingAsync([tagName]);
  },
  /**
   * @param {string[]} tagNames an array of tagNames
   */
  async createTagsIfNotExistingAsync(tagNames) {
    const createTagsUrl = API_URL + 'tags/';
    const body = { tags: tagNames };
    const response = await fetch(createTagsUrl, {
      method: 'POST',
      headers: this._getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  async deleteTagByIdAsync(tagId) {
    const deleteTagUrl = API_URL + 'tags/' + tagId + '/';
    const response = await fetch(deleteTagUrl, {
      method: 'DELETE',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  async getAllTagsAsync() {
    const getTagUrl = API_URL + 'tags/';
    const response = await fetch(getTagUrl, {
      method: 'GET',
      headers: this._getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * @deprecated DO NOT USE
   */
  async updateTagByIdAsync(tagId, update) { // Number, Object{String, String}
    // Number, Object{name, quantity, location, model, description: String, tags: [String]}
    const body = {};
    if (update.name) body.name = update.name;
    if (update.description) body.description = update.description;
    const updateUrl = API_URL + 'tags/' + tagId + '/';
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: this._getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
};

module.exports = tagAccessor;
