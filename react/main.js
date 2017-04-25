const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
// const ReactScrollPagination = require('react-scroll-pagination');
const Login = require('./components/login/login.js');
const MasterView = require('./views/masterView.js');
const STATUS = require('./enums/status.js');
const PERMISSIONS = require('./enums/permissions.js');
const TYPE = require('./enums/type.js');
const VIEWS = require('./enums/views.js');
const accessor = require('./../accessor/accessor.js');
const filestack = require('filestack-js');
const config = require('./../config/config.json');
const Hotkey = require('react-hotkey');

Hotkey.activate();

const Toaster = Blueprint.Toaster.create({
  className: 'toaster',
  position: Blueprint.Position.BOTTOM_LEFT,
});

const Main = React.createClass({
  getInitialState() {
    const isLoggedIn = accessor.isLoggedIn();
    const isRedirected = accessor.isRedirected();
    return {
      isLoggedIn,
      isRedirected,
      loadView: false,
      loading: false,
      loginError: '',
      userId: '',
      requests: [],
      customFields: [],
      instanceCustomFields: [],
      view: VIEWS.ITEMS,
      search: false,
      includeTags: [],
      excludeTags: [],
      includeStatusTags: [],
      excludeStatusTags: [],
      itemDetailObj: {},
      itemLogs: [],
      orders: [],
      loans: [],
      instances: [],
      itemLoans: [],
      orderDetailObj: {},
      orderDetailRequests: [],
      logs: [],
      allTagObjects: [],
      apiKey: '',
      subjectPrefix: '',
      loanEmailBodyPrefix: '',
      loanReminderDate: null,
      subscribed: false,
      filterMinThresh: false,
      dispatchInstances: null,
      instancesObj: [],
    };
  },
  componentDidMount() {
    if (this.state.isLoggedIn) {
      this.fetchDataOnLoginAsync().then(
        () => {
          this.setState({ loadView: true });
        },
      );
    } else if (this.state.isRedirected) {
      accessor.loginWithToken();
    }
  },
  // =========================================================================
  // Login
  // =========================================================================
  onUsernameChange(e) {
    this.setState({
      username: e.target.value,
      loginError: '',
    });
  },
  onPasswordChange(e) {
    this.setState({
      password: e.target.value,
      loginError: '',
    });
  },
  async onSignInClickAsync(username, password) {
    if (username === '') {
      this.setState({
        loginError: 'Please enter a username.',
      });
      return null;
    }

    if (password === '') {
      this.setState({
        loginError: 'Please enter a password.',
      });
      return null;
    }

    const resp = await accessor.loginAsync(username, password);
    if (resp.status === 'success') {
      await this.fetchDataOnLoginAsync();
      this.setState({
        isLoggedIn: true,
        loadView: true,
        loginError: '',
      });
      return resp.status;
    }

    this.setState(this.getInitialState());
    this.setState({
      loginError: resp.error.message,
      password: null,
      username: null,
      userId: null,
      displayName: null,
      email: null,
      permission: null,
    });
    setTimeout(() => {
      this.setState({ loginError: '' });
    }, 3000);
    return resp.status;
  },
  onSignInWithNetIdClick() {
    accessor.loginWithNetId();
  },
  onLogoutClick() {
    accessor.logout();
    this.setState(this.getInitialState());
  },
  // =========================================================================
  // Toaster (for alerts)
  // =========================================================================
  surfaceFailedToast(message) {
    Toaster.show({
      intent: Blueprint.Intent.DANGER,
      message: <span>{message}</span>,
    });
  },
  surfaceSuccessToast(message) {
    Toaster.show({
      intent: Blueprint.Intent.SUCCESS,
      message: <span>{message}</span>,
    });
  },
  surfaceToast(message) {
    Toaster.show({
      message: <span>{message}</span>,
    });
  },
  // =========================================================================
  // View
  // =========================================================================
  async onItemsViewClickAsync() {
    await this.fetchItemsAsync();
    this.setState({ view: VIEWS.ITEMS });
  },
  async onOrdersViewClickAsync() {
    await this.fetchOrdersAsync();
    this.setState({ view: VIEWS.ORDERS });
  },
  async onLoansViewClickAsync() {
    await this.fetchLoansAsync();
    this.setState({ view: VIEWS.LOANS });
  },
  async onOrderClickAsync(bundleId) {
    const bundle = await accessor.getBundleByIdAsync(bundleId);
    const resp = await accessor.getOrdersByBundleIdAsync(bundleId);
    this.setState({
      view: VIEWS.ORDERDETAIL,
      orderDetailObj: bundle.data[0] || {},
      orderDetailRequests: resp.data,
    });
  },
  async onItemClickAsync(itemId) {
    await this.setItemDetailViewItemObjAsync(itemId);
    await this.fetchCustomFieldsAsync();
    this.setState({ view: VIEWS.ITEMDETAIL });
    // We don't await these since they aren't shown in initial view. However,
    // we don't want tab clicks to lag so we fetch data after changing view.
    this.onItemDetailTabClickAsync(VIEWS.LOGS, itemId);
    this.onItemDetailTabClickAsync(VIEWS.LOANS, itemId);
    this.onItemDetailTabClickAsync(VIEWS.INSTANCES, itemId);
  },
  async onItemDetailTabClickAsync(view, itemId) {
    switch (view) {
      case VIEWS.LOANS: {
        this.fetchLoansForItem();
        break;
      }
      case VIEWS.LOGS: {
        if (this.state.permission !== PERMISSIONS.USER) {
          await this.fetchLogsForItemAsync(itemId);
        }
        break;
      }
      case VIEWS.INSTANCES: {
        if (this.state.itemDetailObj.isAsset) {
          this.fetchItemInstancesById(itemId);
        }
        break;
      }
      default: {
        const query = { itemIds: [itemId] };
        const resp = await accessor.getAllBundlesByQueryAsync(query);
        this.setState({ orders: resp.data || [] });
        break;
      }
    }
  },
  async deleteOrderAsync(bundleId) {
    await accessor.deleteBundleAsync(bundleId);
    await this.onOrdersViewClickAsync();
  },
  async onLogsClickAsync() {
    const resp = await accessor.getLogsByQueryAsync();
    await this.fetchUsersAsync();
    await this.fetchItemsAsync();
    this.setState({
      view: VIEWS.LOGS,
      logs: resp.data || [],
    });
  },
  async onChangeViewAsync(newView) {
    switch (newView) {
      case VIEWS.NEWITEM:
        await this.fetchCustomFieldsAsync();
        break;
      case VIEWS.CART:
        await this.fetchCartAsync();
        break;
      case VIEWS.FIELDS:
        await this.fetchCustomFieldsAsync();
        await this.fetchInstanceCustomFieldsAsync();
        break;
      case VIEWS.USERS:
        await this.fetchUsersAsync();
        break;
      case VIEWS.ITEMS:
        await this.fetchItemsAsync();
        break;
      case VIEWS.CONFIGEMAIL:
        await this.fetchCurrentEmailConfigAsync();
        break;
      default:
        break;
    }

    this.setState({ view: newView });
  },
  setViewToItem() {
    // TODO replace call to this function with onChangeViewAsync
    this.onChangeViewAsync(VIEWS.ITEMS);
  },
  setViewToUsers() {
    // TODO replace call to this function with onChangeViewAsync
    this.onChangeViewAsync(VIEWS.USERS);
  },
  // =================================================
  // SEARCH
  // =================================================
  async onSearchItemsClickAsync(searchString) {
    const resp = await accessor.searchItemsByNameAsync(searchString);
    if (resp.status === 'success') {
      const items = resp.data;
      this.setState({
        items,
        search: true,
        includeTags: [],
        excludeTags: [],
      });
    } else {
      this.surfaceFailedToast('Search failed');
    }
  },
  async onSearchRequestsClickAsync(searchString) {
    // TODO Update to search orders rather than requests
    const resp = await accessor.searchBundlesByItemAndUserNameAsync(searchString);
    if (resp.status === 'success') {
      const requests = resp.data;
      this.setState({
        orders: requests,
        search: true,
      });
    } else {
      this.surfaceFailedToast('Search failed');
    }
  },
  async onSearchLoansClickAsync(searchString) {
    const resp = await accessor.getCurrentLoansByNameAsync(searchString);
    if (resp.status === 'success') {
      const loans = resp.data;
      this.setState({
        loans,
        search: true,
      });
    } else {
      this.surfaceFailedToast('Search failed');
    }
  },
  getStatuses() {
    return _.toArray(STATUS);
  },
  // =================================================
  // REQUESTS
  // =================================================
  async createRequestAsync(targetUserId, itemId, quantity) {
    const resp = await accessor.addOrderToCartAsync(itemId, quantity);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item added to cart');
      await this.fetchItemsAsync();
      await this.fetchCartAsync();
    } else {
      this.surfaceFailedToast('Failed to add item to cart');
    }
  },
  async dispatchToUserAsync(targetUserId, itemId, quantity, dispatchComment, instanceIds) {
    const resp = await accessor.dispatchDisburseToUserAsync(
      targetUserId,
      itemId,
      quantity,
      dispatchComment,
      instanceIds,
    );
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item dispatched to user');
      await this.fetchItemsAsync();
      if (this.state.view === VIEWS.ITEMDETAIL) {
        await this.setItemDetailViewItemObjAsync(itemId);
        await this.fetchItemInstancesById(this.state.itemDetailId);
      }
    } else {
      this.surfaceFailedToast('Failed to dispatch item to user');
    }
  },
  async submitOrderAsync(itemId, quantity, dispatchComment, instanceIds, targetUserId) {
    if (this.state.permission === PERMISSIONS.USER) {
      this.createRequestAsync(this.state.userId, itemId, quantity);
    } else {
      this.dispatchToUserAsync(targetUserId, itemId, quantity, dispatchComment, instanceIds);
    }
  },
  async processBundleRequestAsync(bundleId, updateObj) {
    const approved = (updateObj.orderStatus === STATUS.APPROVED);
    let toastText = 'Request ';
    let resp;
    // Call different processing accessors based on order status
    // and request type.
    if (!approved) {
      resp = await accessor.denyBundleAsync(bundleId, updateObj.adminComment);
      toastText = `${toastText} denied`;
    } else {
      const loanRequest = (updateObj.requestType === TYPE.LOAN);
      if (loanRequest) {
        resp = await accessor.approveBundleAsLoanAsync(bundleId, updateObj.adminComment, updateObj.instanceMap);
        toastText = `${toastText} approved as loan`;
      } else {
        resp = await accessor.approveBundleAsDisburseAsync(bundleId, updateObj.adminComment, updateObj.instanceMap);
        toastText = `${toastText} approved as disbursement`;
      }
    }

    if (resp.status === 'success') {
      this.surfaceSuccessToast(toastText);
      await this.onOrderClickAsync(bundleId);
    } else {
      this.surfaceFailedToast(resp.error.message);
    }
  },
  async fetchOrdersAsync() {
    const resp = await accessor.getAllBundlesByQueryAsync();
    this.setState({
      orders: resp.data,
    });
  },
  // =========================================================================
  // Loans
  // =========================================================================
  async convertLoanToDisburseAsync(orderId) {
    const resp = await accessor.convertLoanOrderToDisburseAsync(orderId);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Loan disbursed');
      await this.fetchAfterReturnOrDisburse();
    } else {
      this.surfaceFailedToast('Failed to disburse loan');
    }
  },
  async convertLoanBundleToDisburseAsync() {
    const resp = await accessor.convertLoanBundleToDisburseAsync(this.state.orderDetailObj.id);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Request disbursed');
      await this.fetchAfterReturnOrDisburse();
    } else {
      this.surfaceFailedToast('Failed to disburse order');
    }
  },
  async returnLoanAsync(orderId) {
    const resp = await accessor.returnLoanOrderAsync(orderId);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Loan returned');
      await this.fetchAfterReturnOrDisburse();
    } else {
      this.surfaceFailedToast('Failed to mark loan as returned');
    }
  },
  async fetchLoansAsync() {
    const resp = await accessor.getCurrentLoansByNameAsync();
    this.setState({
      loans: resp.data,
    });
  },
  async fetchLoansForItem() {
    if (this.state.itemDetailObj.id) {
      const loanResp = await accessor.getCurrentLoansByItemIdAsync(this.state.itemDetailObj.id);
      this.setState({ itemLoans: loanResp.data || [] });
    }
  },
  async dispatchAsLoanAsync(userId, itemId, quantity, dispatchComment, instanceIds) {
    const resp = await accessor.dispatchLoanToUserAsync(userId, itemId, quantity, dispatchComment, instanceIds);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item loaned');
      await this.fetchItemsAsync();
      if (this.state.view === VIEWS.ITEMDETAIL) {
        await this.setItemDetailViewItemObjAsync(itemId);
        await this.fetchItemInstancesById(this.state.itemDetailId);
      }
    } else {
      this.surfaceFailedToast('Failed to loan item');
    }
  },
  async onBundleReturnClickAsync(bundleId) {
    const resp = await accessor.returnLoanBundleAsync(bundleId);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Loan returned');
      await this.fetchAfterReturnOrDisburse();
    } else {
      this.surfaceFailedToast('Failed to mark loan as returned');
    }
  },
  async fetchAfterReturnOrDisburse() {
    await this.fetchLoansAsync();
    await this.fetchLoansForItem();
    if (this.state.orderDetailObj) {
      await this.fetchOrdersAsync();
      if (this.state.view === VIEWS.ORDERDETAIL) {
        const bundle = await accessor.getBundleByIdAsync(this.state.orderDetailObj.id);
        const response = await accessor.getOrdersByBundleIdAsync(this.state.orderDetailObj.id);
        this.setState({
          orderDetailObj: bundle.data[0] || {},
          orderDetailRequests: response.data,
        });
      }
    }
  },
  // =========================================================================
  // Email
  // =========================================================================
  async fetchCurrentEmailConfigAsync() {
    const subjectPrefixResp = await accessor.getSubjectPrefixAsync();
    const loanTemplateResp = await accessor.getLoanReminderTemplateAsync();
    const loanDateResp = await accessor.getAllDatesToSendLoanRemindersAsync();

    let date;
    if (loanDateResp.data.length > 0) {
      date = new Date(loanDateResp.data[loanDateResp.data.length - 1].date);
    } else {
      date = new Date();
    }

    this.setState({
      subjectPrefix: subjectPrefixResp.data.preamble,
      loanEmailBodyPrefix: loanTemplateResp.data.preamble,
      loanReminderDate: date,
    });
  },
  async onUpdateLoanReminderTemplateAsync(update) {
    const resp = await accessor.updateLoanReminderTemplateAsync(update);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Email body prefix updated');
      await this.fetchCurrentEmailConfigAsync();
    } else {
      this.surfaceFailedToast('Failed to update email body');
    }
  },
  async onUpdateSubjectPrefixAsync(newSubject) {
    const resp = await accessor.updateSubjectPrefixAsync(newSubject);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Email subject prefix updated');
      await this.fetchCurrentEmailConfigAsync();
    } else {
      this.surfaceFailedToast('Failed to update email subject prefix');
    }
  },
  async onUpdateEmailDateAsync(date) {
    const resp = await accessor.setDateToSendLoanRemindersAsync(date);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Email send date updated');
      await this.fetchCurrentEmailConfigAsync();
    } else {
      this.surfaceFailedToast('Failed to update email send date');
    }
  },
  async subscribeAsync() {
    const resp = await accessor.subscribeAsync();
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Subscribed');
      const respSubscription = await accessor.getSubscriptionStatusAsync();

      this.setState({
        subscribed: respSubscription.data,
      });
    } else {
      this.surfaceFailedToast('Failed to subscribe');
    }
  },
  async unsubscribeAsync() {
    const resp = await accessor.unsubscribeAsync();
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Unsubscribed');
      const respSubscription = await accessor.getSubscriptionStatusAsync();
      this.setState({
        subscribed: respSubscription.data,
      });
    } else {
      this.surfaceFailedToast('Failed to unsubscribe');
    }
  },
  // =========================================================================
  // Items
  // =========================================================================
  async getItemsAsync() {
    const res = await accessor.getItemsByQueryAsync({});
    this.setState({
      search: false,
      includeTags: [],
      excludeTags: [],
    });
    return res.data;
  },
  async updateItemAsync(itemId, updateObj) {
    // create tags if they don't exist
    const tags = updateObj.tags;
    if (tags) {
      await this.onUpdateAllTagsAsync(tags, false);
    }
    const resp = await accessor.updateItemByIdAsync(itemId, updateObj);

    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item updated');
      await this.fetchItemsAsync();
      if (this.state.view === VIEWS.ITEMDETAIL) {
        await this.setItemDetailViewItemObjAsync(itemId);
      }
    } else {
      this.surfaceFailedToast('Failed to update item');
    }
  },
  async onDeleteItemAsync(itemId) {
    const resp = await accessor.deleteItemByIdAsync(itemId);
    // console.log(resp.status, resp.error);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item deleted');
      await this.fetchItemsAsync();
    } else {
      this.surfaceFailedToast('Failed to delete item');
    }
  },
  async createItemAsync(itemName, quantity, extra) {
    if (extra.tags) {
      await this.onUpdateAllTagsAsync(extra.tags, false);
    }
    const resp = await accessor.createItemAsync(itemName, quantity, extra);
    // console.log(resp.status, resp.error);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item created');
      if (extra.tags) {
        await this.onUpdateAllTagsAsync(extra.tags);
      }
      this.onChangeViewAsync(VIEWS.ITEMS);
    } else {
      this.surfaceFailedToast('Failed to create item');
    }
    return resp;
  },
  // =========================================================================
  // Instances
  // =========================================================================
  async onConvertItemAsync(itemId) {
    this.surfaceToast('Item conversion started. We\'ll notify you when its done.');
    const resp = await accessor.convertItemToAssetsAsync(itemId);
    if (resp.status === 'success') {
      this.surfaceSuccessToast('Item successfully converted to asset');
      this.onItemClickAsync(itemId);
      this.fetchItemInstancesById(itemId);
    } else {
      this.surfaceFailedToast('Failed to convert item');
    }
    return resp;
  },
  async onDeleteItemInstanceAsync(assetTag) {
    const resp = await accessor.deleteInstanceByAssetTagAsync(assetTag);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Item instance ${assetTag} deleted`);
      await this.fetchItemInstancesById(this.state.itemDetailId);
    } else {
      this.surfaceFailedToast('Failed to delete item instance');
    }
  },
  async onUpdateItemInstanceAsync(assetTag, updateObj) {
    const resp = await accessor.updateInstanceByAssetTagAsync(assetTag, updateObj);

    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Item instance ${assetTag} updated`);
      if (this.state.view === VIEWS.ITEMDETAIL) {
        await this.fetchItemInstancesById(this.state.itemDetailId);
      }
    } else {
      this.surfaceFailedToast('Failed to update item instance');
    }
  },
  async setItemInstancesObjByItemIdsAsync(itemIds) {
    // TODO implement this
    const resp = await accessor.getItemsAndInstances(itemIds);
    if (resp.status === 'success') {
      this.setState({ instancesObj: resp.data });
    } else {
      this.surfaceFailedToast('Failed to fetch item instances');
    }
  },
  async createItemAsAssetAsync(itemName, quantity, extra) {
   if (extra.tags) {
     await this.onUpdateAllTagsAsync(extra.tags, false);
   }
   const resp = await accessor.createItemAsAssetsAsync(itemName, quantity, extra);
   if (resp.status === 'success') {
     this.surfaceSuccessToast('Item created');
     if (extra.tags) {
       await this.onUpdateAllTagsAsync(extra.tags);
     }
     this.onChangeViewAsync(VIEWS.ITEMS);
   } else {
     this.surfaceFailedToast('Failed to create item');
   }
   return resp;
 },
 async onCreateInstanceAsync(itemId) {
   const resp = await accessor.createInstanceAsync(itemId);
   if (resp.status === 'success') {
     this.surfaceSuccessToast('Asset created');
     await this.fetchItemInstancesById(itemId);
   } else {
     this.surfaceFailedToast('Failed to create item');
   }
   return resp;
 },
  // =========================================================================
  // Tags
  // =========================================================================
  async onUpdateAllTagsAsync(tags, showToastOnSuccess) {
    // return if tags array is empty
    if (tags.length < 1) {
      return;
    }
    const resp = await accessor.createTagsIfNotExistingAsync(tags);
    if (resp.status === 'success') {
      if (showToastOnSuccess) {
        this.surfaceSuccessToast('Tags updated');
      }
      await this.fetchTagsAsync();
    } else {
      this.surfaceFailedToast('Failed to update tags');
    }
  },
  async removeTagByIdAsync(tagId) {
    await accessor.deleteTagByIdAsync(tagId);
    await this.fetchTagsAsync();
  },
  // =========================================================================
  // Filter
  // =========================================================================
  async onSubmitItemsFilterAsync(includeTags, excludeTags) {
    this.setState({ includeTags, excludeTags });

    const includeEmpty = _.isEmpty(includeTags);
    const excludeEmpty = _.isEmpty(excludeTags);
    if (includeEmpty && excludeEmpty) {
      await this.fetchItemsAsync();
      return;
    }

    let query;
    if (!includeEmpty && !excludeEmpty) {
      query = { includeTags, excludeTags };
    } else if (excludeEmpty) {
      query = { includeTags };
    } else {
      query = { excludeTags };
    }

    const resp = await accessor.getItemsByQueryAsync(query);
    if (resp.status === 'success') {
      const items = resp.data;
      this.setState({
        items,
      });
    } else {
      this.surfaceFailedToast('Failed to filter on tags');
    }
  },
  async onSubmitLogsFilterAsync(query) {
    const resp = await accessor.getLogsByQueryAsync(query);
    if (resp.status === 'success') {
      const logs = resp.data;
      this.setState({
        logs,
      });
    } else {
      this.surfaceFailedToast('Failed to filter logs');
    }
  },
  // =========================================================================
  // Users
  // =========================================================================
  async createUserAsync(username, password, extra) {
    const resp = await accessor.createUserAsync(username, password, extra);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`User ${username} created`);
      this.onChangeViewAsync(VIEWS.USERS);
    } else {
      this.surfaceFailedToast('Failed to create user');
    }
  },
  async onUserAccountInfoClick() {
    const respSubscription = await accessor.getSubscriptionStatusAsync();
    const resp = await accessor.getMyApiKeyAsync();

    this.setState({
      view: VIEWS.ACCOUNTINFO,
      apiKey: resp.data || '',
      subscribed: respSubscription.data,
    });
  },
  // =========================================================================
  // Cart
  // =========================================================================
  async onRemoveFromCartAsync(orderId, itemName) {
    const resp = await accessor.removeOrderFromCartAsync(orderId);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`${itemName} removed from cart`);
      await this.fetchCartAsync();
    } else {
      this.surfaceFailedToast(`Failed to remove order ${orderId} from cart`);
    }
  },
  async onSubmitCartAsync(userComment, requestType) {
    const isDisbursement = (requestType === TYPE.DISBURSE);
    let resp;
    if (isDisbursement) {
      resp = await accessor.submitCartAsDisburseAsync(userComment);
    } else {
      resp = await accessor.submitCartAsLoanAsync(userComment);
    }
    await this.fetchOrdersAsync();

    if (resp.status === 'success') {
      const toastText = isDisbursement ? 'Disbursement request submitted' :
        'Loan request submitted';
      this.surfaceSuccessToast(toastText);
      await this.onOrdersViewClickAsync();
      this.fetchCartAsync();
    } else {
      this.surfaceFailedToast('Failed to submit order');
    }
  },
  // =========================================================================
  // Custom fields
  // =========================================================================
  async onCreateFieldAsync(name, type, visibility) {
    const resp = await accessor.createCustomFieldAsync(name, type, visibility);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Field ${name} created.`);
      this.onChangeViewAsync(VIEWS.FIELDS);
    } else {
      this.surfaceFailedToast(`Failed to create field ${name}`);
    }
  },
  async removeFieldByNameAsync(name) {
    const resp = await accessor.deleteCustomFieldAsync(name);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Field ${name} deleted.`);
      await this.fetchCustomFieldsAsync();
    } else {
      this.surfaceFailedToast(`Failed to delete field ${name}`);
    }
  },
  async removeInstanceFieldByNameAsync(name) {
    const resp = await accessor.deleteInstanceCustomFieldAsync(name);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Field ${name} deleted.`);
      await this.fetchInstanceCustomFieldsAsync();
    } else {
      this.surfaceFailedToast(`Failed to delete field ${name}`);
    }
   },
  // =========================================================================
  // Render
  // =========================================================================
  async updateUserPermissionsAsync(userId, permission) {
    const resp = await accessor.grantPermissionToUserAsync(userId, permission);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`User type updated to ${_.capitalize(permission)}`);
      await this.fetchUsersAsync();
    } else {
      this.surfaceFailedToast('Failed to update user type');
    }
  },
  async setItemDetailViewItemObjAsync(itemId) {
    // TODO add toast here for failure
    const resp = await accessor.getItemsByQueryAsync({ id: itemId });
    await this.onItemDetailTabClickAsync(VIEWS.ORDERS, itemId);
    this.setState({
      itemDetailObj: resp.data[0] || {},
      itemDetailId: itemId,
    });
  },
  // =========================================================================
  // Data fetching
  // =========================================================================
  async fetchItemsAsync() {
    const items = await this.getItemsAsync();
    this.setState({
      items,
    });

    // since items use tags, always fetch tags when fetching items
    await this.fetchTagsAsync();
  },
  async fetchTagsAsync() {
    const resp = await accessor.getAllTagsAsync();
    // TODO handle error
    const tags = _.map(resp.data, obj => obj.name) || [];
    this.setState({
      allTags: tags,
      allTagObjects: resp.data,
    });
  },
  async fetchRequestsAsync() {
    const resp = await accessor.getAllBundlesByQueryAsync();
    // TODO handle error
    const requests = resp.data || [];
    this.setState({
      requests,
    });
  },
  async fetchUsersAsync() {
    if (this.state.permission === PERMISSIONS.USER) {
      return;
    }
    // TODO handle error
    const resp = await accessor.getUsersByQueryAsync();
    const users = resp.data;
    this.setState({ users });
  },
  fetchUserInfo() {
    const userInfo = accessor.getUserInfo();
    this.setState({
      userId: userInfo.id,
      username: userInfo.username,
      displayName: userInfo.displayName,
      email: userInfo.email,
      permission: userInfo.permission,
    });
    // set net id if net ID user
    if (userInfo.isNetIdUser) {
      this.setState({
        netId: userInfo.netId,
      });
    }
  },
  async fetchCustomFieldsAsync() {
    // TODO handle errors
    const resp = await accessor.getDefinedCustomFieldsAsync();
    const customFields = resp.data || [];
    this.setState({ customFields });
  },
  async fetchCartAsync() {
    const resp = await accessor.getMyCartedOrdersAsync();
    // TODO handle errors
    const cart = resp.data || [];
    this.setState({ cart });
  },
  async fetchDataOnLoginAsync() {
    this.setState({ loading: true });
    this.fetchUserInfo();
    await this.fetchItemsAsync();
    await this.fetchTagsAsync();
    await this.fetchUsersAsync();
    await this.fetchCustomFieldsAsync();
    await this.fetchCartAsync();
    this.setState({ loading: false });
  },
  async fetchItemInstancesById(itemId) {
    await this.fetchInstanceCustomFieldsAsync();
    const resp = await accessor.getInstancesByQueryAsync({ itemId });
    const instances = resp.data || [];
    this.setState({ instances, itemDetailId: itemId });
  },
  async fetchInstanceCustomFieldsAsync() {
    // TODO handle errors
    const resp = await accessor.getInstanceCustomFieldsAsync();
    const instanceCustomFields = resp.data || [];
    this.setState({ instanceCustomFields });
  },
  // =================================================
  // LOGS
  // =================================================
  async fetchLogsForItemAsync(item) {
    const query = {
      itemId: item,
    };
    const res = await accessor.getLogsByQueryAsync(query);
    this.setState({
      itemLogs: res.data,
    });
  },
  // =========================================================================
  // Bulk Import
  // =========================================================================
  async showPickerAsync() {
    const client = filestack.init(config.filepicker.api_key);
    const resp = await client.pick({
      accept: ['.json'],
      fromSources: ['local_file_system', 'box', 'googledrive', 'dropbox', 'onedrive'],
      onFileUploadFinished: () => {
        this.surfaceSuccessToast('File upload complete');
      },
      onFileUploadFailed: () => {
        this.surfaceFailedToast('Failed to upload file');
      },
    });

    if (resp.filesUploaded) {
      const handle = resp.filesUploaded[0].handle;
      const importResp = await accessor.bulkImportFromJsonFileAsync(handle);
      await this.onItemsViewClickAsync();
      return importResp;
    }

    return null;
  },
  // =================================================
  // Backfill
  // =================================================
  async showBackfillPickerAsync() {
    const client = filestack.init(config.filepicker.api_key);
    const resp = await client.pick({
      accept: ['.pdf'],
      fromSources: ['local_file_system', 'box', 'googledrive', 'dropbox', 'onedrive'],
      onFileUploadFinished: () => {
        this.surfaceSuccessToast('File upload complete');
      },
      onFileUploadFailed: () => {
        this.surfaceFailedToast('Failed to upload file');
      },
    });

    if (resp.filesUploaded) {
      const handle = resp.filesUploaded[0].handle;
      return handle;
    }

    return null;
  },
  async submitBackfillReceiptAsync(orderIds, fileHandle) {
    await accessor.submitProofForOrdersAsync(orderIds, fileHandle);
    await this.fetchAfterReturnOrDisburse();
  },
  async approveBackfillForOrderAsync(orderId) {
    await accessor.approveBackfillForOrderAsync(orderId);
    await this.fetchAfterReturnOrDisburse();
  },
  async denyBackfillForOrderAsync(orderId) {
    await accessor.denyBackfillForOrderAsync(orderId);
    await this.fetchAfterReturnOrDisburse();
  },
  // =================================================
  // Minimum Stock
  // =================================================
  async setMinStockThresholdAsync(itemIds, threshold) {
    const resp = await accessor.setMinStockThresholdAsync(itemIds, false, threshold);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Minimum quantity updated to ${threshold} for ${itemIds.size} items`);
      await this.fetchItemsAsync();
    } else {
      this.surfaceFailedToast('Failed to update minimum quantity');
    }
  },
  async toggleFilterMinThreshAsync() {
    let resp = {};
    if (!this.state.filterMinThresh) {
      resp = await accessor.getItemsBelowMinStockThresholdAsync();
    } else {
      resp = await accessor.getItemsByQueryAsync({});
    }
    this.setState({ filterMinThresh: !this.state.filterMinThresh, items: resp.data });
  },
  async convertItemCustomFieldsToPerAssetsAsync(customFieldName) {
    const resp = await accessor.convertItemCustomFieldsToPerAssetsAsync(customFieldName);
    if (resp.status === 'success') {
      this.surfaceSuccessToast(`Converted ${customFieldName} to per asset`);
      await this.fetchCustomFieldsAsync();
      await this.fetchInstanceCustomFieldsAsync();
    } else {
      this.surfaceFailedToast('Failed to convert');
    }
  },
  // =================================================
  // RENDER
  // =================================================
  render() {
    const loadingSpinner = (!this.state.isLoggedIn && this.state.isRedirected)
      || (this.state.isLoggedIn && this.state.loading);
    return (
      <div className="app">
        {loadingSpinner &&
          <div className="spinnerContainer pt-spinner pt-large">
            <div className="pt-spinner-svg-container">
              <svg viewBox="0 0 100 100">
                <path
                  className="pt-spinner-track"
                  d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
                />
                <path
                  className="pt-spinner-head"
                  d="M 94.5 50 A 44.5 44.5 0 0 0 50 5.5"
                />
              </svg>
            </div>
          </div>}
        {(!this.state.isLoggedIn && !this.state.isRedirected) &&
        <Login
          onSignInClick={this.onSignInClickAsync}
          onSignInWithNetIdClick={this.onSignInWithNetIdClick}
          errorMessage={this.state.loginError}
          loading={this.state.loading}
        />}
        {(this.state.isLoggedIn && this.state.loadView && !this.state.loading) &&
        <MasterView
          currentView={this.state.view}
          onUserAccountInfoClick={this.onUserAccountInfoClick}
          onRequestsClick={this.onRequestsClick}
          onLogoutClick={this.onLogoutClick}
          onSearchRequestsClick={this.onSearchRequestsClickAsync}
          onSearchItemsClick={this.onSearchItemsClickAsync}
          onSearchLoansClick={this.onSearchLoansClickAsync}
          onRequestsViewClick={this.onRequestsViewClickAsync}
          onItemClick={this.onItemClickAsync}
          onItemsViewClick={this.onItemsViewClickAsync}
          onCreateUser={this.createUserAsync}
          onItemDetailTabClick={this.onItemDetailTabClickAsync}
          statuses={this.getStatuses()}
          requests={this.state.requests}
          items={this.state.items}
          permission={this.state.permission}
          users={this.state.users}
          allTags={this.state.allTags}
          username={this.state.username}
          userEmail={this.state.email}
          displayName={this.state.displayName}
          onUpdateItem={this.updateItemAsync}
          onCreateOrModifyItem={this.createItemAsync}
          onCreateItemAsAsset={this.createItemAsAssetAsync}
          onCreateField={this.onCreateFieldAsync}
          onDeleteItem={this.onDeleteItemAsync}
          onConvertItemClick={this.onConvertItemAsync}
          submitOrder={this.submitOrderAsync}
          search={this.state.search}
          onSubmitItemsFilter={this.onSubmitItemsFilterAsync}
          onSubmitLogsFilter={this.onSubmitLogsFilterAsync}
          excludeTags={this.state.excludeTags}
          includeTags={this.state.includeTags}
          excludeStatusTags={this.state.excludeStatusTags}
          includeStatusTags={this.state.excludeStatusTags}
          setViewToItem={this.setViewToItem}
          onChangeView={this.onChangeViewAsync}
          customFields={this.state.customFields}
          setViewToUsers={this.setViewToUsers}
          updateUserPermission={this.updateUserPermissionsAsync}
          onRemoveFromCart={this.onRemoveFromCartAsync}
          onSubmitCart={this.onSubmitCartAsync}
          cart={this.state.cart}
          fetchLogsForItemAsync={this.fetchLogsForItemAsync}
          itemDetailObj={this.state.itemDetailObj}
          setItemDetailViewItemObjAsync={this.setItemDetailViewItemObjAsync}
          itemLogs={this.state.itemLogs}
          onOrdersClick={this.onOrdersViewClickAsync}
          onLoansClick={this.onLoansViewClickAsync}
          orders={this.state.orders}
          instances={this.state.instances}
          loans={this.state.loans}
          itemLoans={this.state.itemLoans}
          disburseLoan={this.convertLoanToDisburseAsync}
          disburseLoanBundle={this.convertLoanBundleToDisburseAsync}
          returnLoan={this.returnLoanAsync}
          dispatchAsLoan={this.dispatchAsLoanAsync}
          onOrderClick={this.onOrderClickAsync}
          orderDetailObj={this.state.orderDetailObj}
          orderDetailRequests={this.state.orderDetailRequests}
          processBundle={this.processBundleRequestAsync}
          onLogsClick={this.onLogsClickAsync}
          globalLogs={this.state.logs}
          removeTag={this.removeTagByIdAsync}
          deleteField={this.removeFieldByNameAsync}
          deleteInstanceField={this.removeInstanceFieldByNameAsync}
          allTagObjects={this.state.allTagObjects}
          apiKey={this.state.apiKey}
          onBulkImport={this.showPickerAsync}
          // backfill
          onBackfillFileUpload={this.showBackfillPickerAsync}
          submitBackfillReceipt={this.submitBackfillReceiptAsync}
          onBundleReturnClick={this.onBundleReturnClickAsync}
          showPicker={this.showPickerAsync}
          instanceCustomFields={this.state.instanceCustomFields}
          deleteItemInstance={this.onDeleteItemInstanceAsync}
          updateItemInstance={this.onUpdateItemInstanceAsync}
          approveBackfill={this.approveBackfillForOrderAsync}
          denyBackfill={this.denyBackfillForOrderAsync}
          // emails
          subjectPrefix={this.state.subjectPrefix}
          loanEmailBodyPrefix={this.state.loanEmailBodyPrefix}
          loanReminderDate={this.state.loanReminderDate}
          onUpdateLoanReminderTemplate={this.onUpdateLoanReminderTemplateAsync}
          onUpdateSubjectPrefix={this.onUpdateSubjectPrefixAsync}
          onSetDateToSendLoanReminders={this.onUpdateEmailDateAsync}
          onSubscribe={this.subscribeAsync}
          onUnsubscribe={this.unsubscribeAsync}
          subscribed={this.state.subscribed}
          // instances
          setItemInstancesObjByItemIds={this.setItemInstancesObjByItemIdsAsync}
          instancesObj={this.state.instancesObj}
          onCreateInstance={this.onCreateInstanceAsync}
          // minimum stock
          setMinStockThreshold={this.setMinStockThresholdAsync}
          convertCustomField={this.convertItemCustomFieldsToPerAssetsAsync}
          filterMinThresh={this.state.filterMinThresh}
          toggleFilterMinThresh={this.toggleFilterMinThreshAsync}
          deleteOrder={this.deleteOrderAsync}
          userid={this.state.userId}
        />}
      </div>
    );
  },
});

module.exports = Main;
