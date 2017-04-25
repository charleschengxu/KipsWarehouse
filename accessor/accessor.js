if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const userAccessor = require('./userAccessor');
const tagAccessor = require('./tagAccessor');
const itemAccessor = require('./itemAccessor');
const instanceAccessor = require('./instanceAccessor');
const orderAccessor = require('./orderAccessor');
const logAccessor = require('./logAccessor');
const emailAccessor = require('./emailAccessor');

/**
 *  Handles calls to the API.
 */
const accessor = {
  // =========================================================================
  // Config, should not use directly.
  // =========================================================================
  _getAuthHeader() { return userAccessor.getAuthHeader(); },

  // =========================================================================
  // Login/Logout. Refer to userAccessor.
  // =========================================================================
  isLoggedIn() { return userAccessor.isLoggedIn(); },
  isRedirected() { return userAccessor.isRedirected(); },
  getUserInfo() { return userAccessor.getUserInfo(); },
  getId() { return userAccessor.getId(); },
  getToken() { return userAccessor.getToken(); },
  getPermission() { return userAccessor.getPermission(); },
  getEmail() { return userAccessor.getEmail(); },
  loginWithToken() { userAccessor.loginWithToken(); },
  loginWithNetId() { userAccessor.loginWithNetId(); },
  logout() { userAccessor.logout(); },
  async loginAsync(username, password) {
    return userAccessor.loginAsync(username, password);
  },

  // =========================================================================
  // Users. Refer to userAccessor.
  // =========================================================================
  async getMyApiKeyAsync() {
    return userAccessor.getMyApiKeyAsync();
  },
  async grantPermissionToUserAsync(userId, permission) {
    return userAccessor.grantPermissionToUserAsync(userId, permission);
  },
  async createUserAsync(username, password, extra) {
    return userAccessor.createUserAsync(username, password, extra);
  },
  async getUsersByQueryAsync(userId) {
    return userAccessor.getUsersByQueryAsync(userId);
  },
  async searchUsersByNameAsync(partialName) {
    return userAccessor.searchUsersByNameAsync(partialName);
  },
  async updateUserByIdAsync(userId, update) {
    return userAccessor.updateUserByIdAsync(userId, update);
  },

  // =========================================================================
  // Tags. Refer to tagAccessor.
  // =========================================================================
  async createTagAsync(tagName) {
    return tagAccessor.createTagAsync(tagName);
  },
  async createTagsIfNotExistingAsync(tagNames) {
    return tagAccessor.createTagsIfNotExistingAsync(tagNames);
  },
  async deleteTagByIdAsync(tagId) {
    return tagAccessor.deleteTagByIdAsync(tagId);
  },
  async getAllTagsAsync() {
    return tagAccessor.getAllTagsAsync();
  },

  // =========================================================================
  // Items. Refer to itemAccessor.
  // =========================================================================
  async createItemAsync(itemName, quantity, extra) {
    return itemAccessor.createItemAsync(itemName, quantity, extra);
  },
  async deleteItemByIdAsync(itemId) {
    return itemAccessor.deleteItemByIdAsync(itemId);
  },
  async searchItemsByNameAsync(partialName) {
    return itemAccessor.searchItemsByNameAsync(partialName);
  },
  async getItemsByQueryAsync(query) {
    return itemAccessor.getItemsByQueryAsync(query);
  },
  async updateItemByIdAsync(itemId, update) {
    return itemAccessor.updateItemByIdAsync(itemId, update);
  },
  async updateItemQuantityThroughDeltaAsync(itemId, delta, comment) {
    return itemAccessor.updateItemQuantityThroughDeltaAsync(itemId, delta, comment);
  },
  async getDefinedCustomFieldsAsync() {
    return itemAccessor.getDefinedCustomFieldsAsync();
  },
  async createCustomFieldAsync(name, type, visibility) {
    return itemAccessor.createCustomFieldAsync(name, type, visibility);
  },
  async updateCustomFieldAsync(name, visibility) {
    return itemAccessor.updateCustomFieldAsync(name, visibility);
  },
  async deleteCustomFieldAsync(name) {
    return itemAccessor.deleteCustomFieldAsync(name);
  },
  async bulkImportFromJsonFileAsync(handle) {
    return itemAccessor.bulkImportFromJsonFileAsync(handle);
  },



  // *********************ev4 newly added*********************
  async convertItemToAssetsAsync(itemId) {
    return itemAccessor.convertItemToAssetsAsync(itemId);
  },
  async convertItemCustomFieldsToPerAssetsAsync(customFieldName) {
    return itemAccessor.convertItemCustomFieldsToPerAssetsAsync(customFieldName);
  },
  async setMinStockThresholdAsync(itemIds, invertSelection, threshold) {
    return itemAccessor.setMinStockThresholdAsync(itemIds, invertSelection, threshold);
  },
  async getItemsBelowMinStockThresholdAsync() {
    return itemAccessor.getItemsBelowMinStockThresholdAsync();
  },
  async createItemAsAssetsAsync(itemName, quantity, extra) {
    return itemAccessor.createItemAsAssetsAsync(itemName, quantity, extra);
  },
  async getItemsAndInstances(itemIds) {
    return itemAccessor.getItemsAndInstances(itemIds);
  },

  // =========================================================================
  // Instances. Refer to instanceAccessor.
  // =========================================================================
  async getInstanceCustomFieldsAsync() {
    return instanceAccessor.getInstanceCustomFieldsAsync();
  },
  async createInstanceCustomFieldAsync(name, type, visibility) {
    return instanceAccessor.createInstanceCustomFieldAsync(name, type, visibility);
  },
  async deleteInstanceCustomFieldAsync(name) {
    return instanceAccessor.deleteInstanceCustomFieldAsync(name);
  },
  async updateInstanceCustomFieldAsync(name, visibility) {
    return instanceAccessor.updateInstanceCustomFieldAsync(name, visibility);
  },
  async getInstancesByQueryAsync(query) {
    return instanceAccessor.getInstancesByQueryAsync(query);
  },
  async createInstanceAsync(itemId, extra) {
    return instanceAccessor.createInstanceAsync(itemId, extra);
  },
  async updateInstanceByAssetTagAsync(assetTag, update) {
    return instanceAccessor.updateInstanceByAssetTagAsync(assetTag, update);
  },
  async deleteInstanceByAssetTagAsync(assetTag) {
    return instanceAccessor.deleteInstanceByAssetTagAsync(assetTag);
  },

  // =========================================================================
  // Cart. Refer to orderAccessor.
  // =========================================================================
  async addOrderToCartAsync(itemId, quantity) {
    return orderAccessor.addOrderToCartAsync(itemId, quantity);
  },
  async removeOrderFromCartAsync(orderId) {
    return orderAccessor.removeOrderFromCartAsync(orderId);
  },
  async getMyCartedOrdersAsync() {
    return orderAccessor.getMyCartedOrdersAsync();
  },
  // =========================================================================
  // Bundles and Orders. Refer to orderAccessor.
  // =========================================================================
  async searchBundlesByItemAndUserNameAsync(partialName) {
    return orderAccessor.searchBundlesByItemAndUserNameAsync(partialName);
  },
  async getBundleByIdAsync(bundleId) {
    return orderAccessor.getBundleByIdAsync(bundleId);
  },
  async getAllBundlesByQueryAsync(query) {
    return orderAccessor.getAllBundlesByQueryAsync(query);
  },
  async getOrdersByBundleIdAsync(bundleId) {
    return orderAccessor.getOrdersByBundleIdAsync(bundleId);
  },
  async deleteBundleAsync(bundleId) {
    return orderAccessor.deleteBundleAsync(bundleId);
  },
  async denyBundleAsync(bundleId, adminComment) {
    return orderAccessor.denyBundleAsync(bundleId, adminComment);
  },

  // *********************ev3 newly added*********************
  async submitCartAsLoanAsync(userComment) {
    return orderAccessor.submitCartAsLoanAsync(userComment);
  },
  async submitCartAsDisburseAsync(userComment) {
    return orderAccessor.submitCartAsDisburseAsync(userComment);
  },
  // ********refer to orderAccessor for how to construct instanceIds.
  async dispatchLoanToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds) {
    return orderAccessor.dispatchLoanToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds);
  },
  async dispatchDisburseToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds) {
    return orderAccessor.dispatchDisburseToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds);
  },
  // !!!!!!!!!refer to orderAccessor for how to construct instanceMap.
  async approveBundleAsLoanAsync(bundleId, adminComment, instanceMap) {
    return orderAccessor.approveBundleAsLoanAsync(bundleId, adminComment, instanceMap);
  },
  async approveBundleAsDisburseAsync(bundleId, adminComment, instanceMap) {
    return orderAccessor.approveBundleAsDisburseAsync(bundleId, adminComment, instanceMap);
  },
  async returnLoanBundleAsync(bundleId) {
    return orderAccessor.returnLoanBundleAsync(bundleId);
  },
  async returnLoanOrderAsync(orderId) {
    return orderAccessor.returnLoanOrderAsync(orderId);
  },
  async convertLoanBundleToDisburseAsync(bundleId) {
    return orderAccessor.convertLoanBundleToDisburseAsync(bundleId);
  },
  async convertLoanOrderToDisburseAsync(orderId) {
    return orderAccessor.convertLoanOrderToDisburseAsync(orderId);
  },
  async getCurrentLoansByItemIdAsync(itemId) {
    return orderAccessor.getCurrentLoansByItemIdAsync(itemId);
  },
  async getCurrentLoansByNameAsync(partialName) {
    return orderAccessor.getCurrentLoansByNameAsync(partialName);
  },

   // =========================================================================
  // Emails. Refer to emailAccessor.
  // =========================================================================
  async getSubscriptionStatusAsync() {
    return emailAccessor.getSubscriptionStatus();
  },
  async subscribeAsync() {
    return emailAccessor.subscribe();
  },
  async unsubscribeAsync() {
    return emailAccessor.unsubscribe();
  },
  async getLoanReminderTemplateAsync() {
    return emailAccessor.getLoanReminderTemplate();
  },
  async updateLoanReminderTemplateAsync(newPreamble) {
    return emailAccessor.updateLoanReminderTemplate(newPreamble);
  },
  async getSubjectPrefixAsync() {
    return emailAccessor.getSubjectPrefix();
  },
  async updateSubjectPrefixAsync(newPreamble) {
    return emailAccessor.updateSubjectPrefix(newPreamble);
  },
  async getAllDatesToSendLoanRemindersAsync() {
    return emailAccessor.getAllDatesToSendLoanReminders();
  },
  async setDateToSendLoanRemindersAsync(date) {
    return emailAccessor.setDateToSendLoanReminders(date);
  },
  async removeDateToSendLoanRemindersAsync(date) {
    return emailAccessor.removeDateToSendLoanReminders(date);
  },

  // =========================================================================
  // Logs. Refer to logAccessor.
  // =========================================================================
  async getLogsByQueryAsync(query) {
    return logAccessor.getLogsByQueryAsync(query);
  },

  // =========================================================================
  // Backfills. Refer to orderAccessor.
  // =========================================================================
  async submitProofForOrdersAsync(orderIds, fileHandle) {
    return orderAccessor.submitProofForOrdersAsync(orderIds, fileHandle);
  },
  async removeProofAsync(proofId) {
    return orderAccessor.removeProofAsync(proofId);
  },
  async approveBackfillForOrderAsync(orderId) {
    return orderAccessor.approveBackfillForOrderAsync(orderId);
  },
  async denyBackfillForOrderAsync(orderId) {
    return orderAccessor.denyBackfillForOrderAsync(orderId);
  },

};

module.exports = accessor;
