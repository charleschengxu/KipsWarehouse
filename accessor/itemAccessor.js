const configAccessor = require('./configAccessor');
const userAccessor = require('./userAccessor');

const API_URL = configAccessor.getApiUrl();

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const itemAccessor = {
  /**
   * Create a new item with <tt>itemName<\tt> and <tt>quantity<\tt>
   * @param  {String} itemName the name of the item, used for frontend display
   * @param  {Number} quantity initial quantity of the item
   * @param  {Object} extra    a map of optional parameters including custom fields
   * @return {Object}          a json response by the server
   */
  async createItemAsync(itemName, quantity, extra) {
    const createItemUrl = API_URL + 'items/' + itemName + '/' + quantity + '/';
    const body = {};
    // Must go key by key since custom fields unknown in advance
    for (let field in extra) {
      if (extra[field]) body[field] = extra[field];
    }
    const response = await fetch(createItemUrl, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  async createItemAsAssetsAsync(itemName, quantity, extra) {
    extra.isAsset = 1;
    return await this.createItemAsync(itemName, quantity, extra);
  },

  /**
   * if item not isAsset, its 'instances' attribute is an empty array.
   */
  async getItemsAndInstances(itemIds) {
    const url = API_URL + 'items/getItemsAndInstances';
    const body = { itemIds: itemIds };
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Delete an existing item with <tt>itemId<\tt>
   * @param  {Number} itemId the unique id of the item one wishes to delete
   * @return {Object}        a json response by the server
   */
  async deleteItemByIdAsync(itemId) {
    const deleteItemUrl = API_URL + 'items/' + itemId + '/';
    const response = await fetch(deleteItemUrl, {
      method: 'DELETE',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Find a list of items whose names or models matches *${partialName}*
   * where '*' is the wildcard
   * @param {String} partialName search string
   */
  async searchItemsByNameAsync(partialName) {
    return this.getItemsByQueryAsync({
      name: partialName,
      model: partialName,
    });
  },

  /**
   * PRIVATE FIELDS ARE SHOWN AS NULL FOR NORMAL USERS
   * GET ALL CUSTOM FIELDS FIRST TO CHECK VISIBILITY, THEN HIDE SOME COLUMN IF NEEDED
   *
   * @param {object} query
   * {id: Number, includeTags: [String], excludeTags: [String],
   *  name: String, model: String, rowPerPage: Number, pageNumer: Number}
   */
  async getItemsByQueryAsync(query) {
    let getItemsUrl = API_URL + 'items/?';
    function appendURL(key, value) {
      if (value && value != 'undefined')
        getItemsUrl += key + '=' + value + '&'
    }
    appendURL('id', query.id)
    appendURL('includeTags', encodeURIComponent(JSON.stringify(query.includeTags)))
    appendURL('excludeTags', encodeURIComponent(JSON.stringify(query.excludeTags)))
    appendURL('name', encodeURIComponent(query.name))
    appendURL('model', encodeURIComponent(query.model))
    appendURL('rowPerPage', query.rowPerPage)
    appendURL('pageNumber', query.pageNumber)
    console.log('getItemsUrl: ', getItemsUrl);
    const response = await fetch(getItemsUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader()
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * [description]
   * @param  {Number} itemId identifies an item to be updated
   * @param  {Object} update map of <field, newValue> to be applied on item
   * @return {Object}        a json response by the server
   */
  async updateItemByIdAsync(itemId, update) {
    const body = {};
    // Must go key by key since custom fields unknown in advance
    for (let field in update) {
      if (update[field]) body[field] = update[field];
    }
    const updateUrl = API_URL + 'items/' + itemId + '/';
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * @param  {Number}  itemId identifies the item to be updated.
   * @param  {Number}  delta is the change in quantity, could be positive or negative
   * @param  {String}  comment optional
   */
  async updateItemQuantityThroughDeltaAsync(itemId, delta, comment) {
    const updateUrl = API_URL + 'items/' + itemId + '/' + delta + '/';
    const body = {comment: comment || undefined};
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Get the list of all the custom fields that are defined
   * @return {Object} a json response by the server
   */
  async getDefinedCustomFieldsAsync() {
    const url = API_URL + 'items/customFields/';
    const response = await fetch(url, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Create a new custom field on all items, given name, type, and visibility.
   * The type of the field cannot be changed after field is created. If one has to,
   * she shall explicit delete the field, and then create it with a different type.
   *
   * @param  {String} name     the name of the custom field, must be unique
   * @param  {Enum} type       {'SHORT','LONG','INT','FLOAT'}
   * @param  {Enum} visibility {'PRIVATE','PUBLIC'}
   * @return {Object} a json response by the server
   */
  async createCustomFieldAsync(name, type, visibility) {
    const url = API_URL + 'items/customFields/' + name + '/' + type + '/' + visibility;
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Update the visibility of a custom field
   * @param  {String} name       of the custom field
   * @param  {Enum} visibility {'PRIVATE','PUBLIC'}
   * @return {Object}            a json response by the server
   */
  async updateCustomFieldAsync(name, visibility) {
    const url = API_URL + 'items/customFields/' + name + '/' + visibility;
    const response = await fetch(url, {
      method: 'PUT',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Remove a custom field on all items. Data associated with this field also deleted
   * @param  {String} name of the custom field
   * @return {Object}      a json response by the server
   */
  async deleteCustomFieldAsync(name) {
    const url = API_URL + 'items/customFields/' + name;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Bulk import items
   * @param  {Object} hanle file handle returned by filestack
   * @return {Object}       a json response by the server
   */
  async bulkImportFromJsonFileAsync(handle) {
    const url = API_URL + 'items/import';
    const body = {
      fileHandle: handle,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  /**
   * Remove a custom field on all items. Data associated with this field also deleted
   * @param  {Number} itemId of the custom field
   * @return {Object}        a json response by the server
   */
  async convertItemToAssetsAsync(itemId) {
    const url = API_URL + 'items/convertToAsset';
    const body = {
      itemId: itemId,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Convert a custom field on each item to be on all instances of an item
   * @param  {String} customFieldName name of the item custom field to be converted
   * @return {Object}        a json response by the server
   */
  async convertItemCustomFieldsToPerAssetsAsync(customFieldName) {
    const url = API_URL + 'items/customFields/convertToPerAsset';
    const body = {
      name: customFieldName,
    };
    const response = await fetch(url, {
      method: 'PUT',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Set the minimum threshold on items quantity. If quant fall below such threshold,
   * emails will be sent to subsribed managers.
   * @param {Array<String>} itemIds         list of ids of selected items
   * @param {Boolean} invertSelection  true if the threshold is meant to be set on the selected items
   *                                   false if the selection is inverted
   * @param {Integer} threshold        a non-negative value as the minimum stock quantity
   */
  async setMinStockThresholdAsync(itemIds, invertSelection, threshold) {
    const url = API_URL + 'items/threshold';
    const body = {
      itemIds: itemIds,
      invertSelection: invertSelection,
      threshold: threshold,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Fetch a list of items whose quantities are below their respective minimum threshold.
   */
  async getItemsBelowMinStockThresholdAsync() {
    const url = API_URL + 'items/threshold';
    const response = await fetch(url, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
};

module.exports = itemAccessor;
