const configAccessor = require('./configAccessor');
const userAccessor = require('./userAccessor');

const API_URL = configAccessor.getApiUrl();

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const instanceAccessor = {
	// -------------------- INSTANCE CUSTOM FIELDS -------------------
	/**
   * Get the list of all the custom fields on instance that are defined
   * @return {Object} a json response by the server
   */
  async getInstanceCustomFieldsAsync() {
    const url = API_URL + 'instances/customFields/';
    const response = await fetch(url, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Create a new custom field on all instances, given name, type, and visibility.
   * The type of the field cannot be changed after field is created. If one has to,
   * she shall explicit delete the field, and then create it with a different type.
   *
   * @param  {String} name     the name of the custom field, must be unique
   * @param  {Enum} type       {'SHORT','LONG','INT','FLOAT'}
   * @param  {Enum} visibility {'PRIVATE','PUBLIC'}
   * @return {Object} a json response by the server
   */
  async createInstanceCustomFieldAsync(name, type, visibility) {
    const url = API_URL + 'instances/customFields/' + name + '/' + type + '/' + visibility;
    const response = await fetch(url, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Remove an instance custom field on all instances.
   * Data associated with this field also deleted
   * @param  {String} name of the custom field
   * @return {Object}      a json response by the server
   */
  async deleteInstanceCustomFieldAsync(name) {
    const url = API_URL + 'instances/customFields/' + name;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Update the visibility of an instance custom field
   * @param  {String} name       of the custom field
   * @param  {Enum} visibility 		{'PRIVATE','PUBLIC'}
   * @return {Object}            a json response by the server
   */
  async updateInstanceCustomFieldAsync(name, visibility) {
    const url = API_URL + 'instances/customFields/' + name + '/' + visibility;
    const response = await fetch(url, {
      method: 'PUT',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },

  // ------------------------- INSTANCES -------------------------

	/**
   * PRIVATE FIELDS ARE SHOWN AS NULL FOR NORMAL USERS
   * GET ALL CUSTOM FIELDS FIRST TO CHECK VISIBILITY, THEN HIDE SOME COLUMN IF NEEDED
   *
   * @param {object} query supports { itemId: Number,
   *                       						assetTag: Number,
   *                       	     			rowPerPage: Number,
   *                       	        	pageNumer: Number }
   */
  async getInstancesByQueryAsync(query) {
    let getInstancesUrl = API_URL + 'instances/?';
    function appendURL(key, value) {
      if (value && value != 'undefined')
        getInstancesUrl += key + '=' + value + '&'
    }
    appendURL('itemId', query.itemId)
    appendURL('assetTag', query.assetTag)
    appendURL('rowPerPage', query.rowPerPage)
    appendURL('pageNumber', query.pageNumber)
    console.log('getInstancesUrl: ', getInstancesUrl);
    const response = await fetch(getInstancesUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader()
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
	/**
   * Create a new instance of the item identified using itemId
   * @param  {Number} itemId identifies an item to which the new instance belongs
   * @param  {Object} extra  a map of optional parameters including custom fields
   *                        { assetTag: Number
   *                          instanceStatus: "AVAILABLE" | "DISBURSE" | "LOAN",
   *                          instance_location: String, //custom field
   *                          other_custom_field: String }
   * @return {Object}        a json response by the server
   */
  async createInstanceAsync(itemId, extra) {
    const createInstanceUrl = API_URL + 'instances/' + itemId;
    const body = {};
    // Must go key by key since custom fields unknown in advance
    for (let field in extra) {
      if (extra[field]) body[field] = extra[field];
    }
    const response = await fetch(createInstanceUrl, {
      method: 'POST',
      headers: userAccessor.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
  /**
   * Update an existing instance
   * @param  {Number} assetTag identifies an instance to be updated
   * @param  {Object} update map of <field, newValue> to be applied on the instance
   *                         { assetTag: Number
   *                          instanceStatus: "AVAILABLE" | "DISBURSE" | "LOAN",
   *                          instance_location: String, //custom field
   *                          other_custom_field: String }
   * @return {Object}        a json response by the server
   */
  async updateInstanceByAssetTagAsync(assetTag, update) {
    const body = {};
    // Must go key by key since custom fields unknown in advance
    for (let field in update) {
      if (update[field]) body[field] = update[field];
    }
    const updateUrl = API_URL + 'instances/' + assetTag;
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
	 * Delete an existing instance with <tt>assetTag<\tt>
	 * @param  {Number} assetTag the unique tag of the instance one wishes to delete
	 * @return {Object}        a json response by the server
	 */
  async deleteInstanceByAssetTagAsync(assetTag) {
    const deleteInstanceUrl = API_URL + 'instances/' + assetTag + '/';
    const response = await fetch(deleteInstanceUrl, {
      method: 'DELETE',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log(responseJson);
    return responseJson;
  },
}

module.exports = instanceAccessor;
