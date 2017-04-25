const React = require('react');
const NavBar = require('./../components/navigation/navBar.js');
const ItemList = require('./itemList.js');
const ItemDetail = require('./itemDetail.js');
const NewItemForm = require('./newItemForm.js');
const NewUserView = require('./newUserView.js');
const NewFieldView = require('./newFieldView.js');
const BulkImportView = require('./bulkImportView.js');
const CartView = require('./cartView.js');
const UsersList = require('./usersList.js');
const OrderList = require('./orderList.js');
const OrderDetail = require('./orderDetail.js');
const LogList = require('./logList.js');
const LoanList = require('./loanList.js');
const TagsList = require('./tagsList.js');
const FieldsListView = require('./fieldsListView.js');
const MinimumStockListView = require('./minimumStockListView.js');
const VIEWS = require('./../enums/views.js');
const PERMISSIONS = require('./../enums/permissions.js');
const configAccessor = require('./../../accessor/configAccessor.js');
const EmailView = require('./emailView.js');

// User view with navigation bar and item list.
// TODO add pagination
const MasterView = React.createClass({
  propTypes: {
    currentView: React.PropTypes.number.isRequired,
    // on click handlers
    onLogoutClick: React.PropTypes.func.isRequired,
    onSearchRequestsClick: React.PropTypes.func.isRequired,
    onSearchItemsClick: React.PropTypes.func.isRequired,
    onSearchLoansClick: React.PropTypes.func.isRequired,
    onItemsViewClick: React.PropTypes.func.isRequired,
    onItemClick: React.PropTypes.func.isRequired,
    onCreateUser: React.PropTypes.func.isRequired,
    onUserAccountInfoClick: React.PropTypes.func.isRequired,
    onOrdersClick: React.PropTypes.func.isRequired,
    onLoansClick: React.PropTypes.func.isRequired,
    onBundleReturnClick: React.PropTypes.func.isRequired,
    onItemDetailTabClick: React.PropTypes.func.isRequired,
    onConvertItemClick: React.PropTypes.func.isRequired,
    // data
    statuses: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    items: React.PropTypes.array.isRequired,
    instances: React.PropTypes.array.isRequired,
    permission: React.PropTypes.string.isRequired,
    users: React.PropTypes.array,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    instanceCustomFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string,
      visibility: React.PropTypes.string,
      type: React.PropTypes.string,
    })).isRequired,
    orders: React.PropTypes.array.isRequired,
    // instances
    deleteItemInstance: React.PropTypes.func.isRequired,
    updateItemInstance: React.PropTypes.func.isRequired,
    //  loans
    loans: React.PropTypes.array.isRequired,
    disburseLoan: React.PropTypes.func.isRequired,
    returnLoan: React.PropTypes.func.isRequired,
    dispatchAsLoan: React.PropTypes.func.isRequired,
    itemLoans: React.PropTypes.array.isRequired,
    disburseLoanBundle: React.PropTypes.func.isRequired,
    // action handlers
    onUpdateItem: React.PropTypes.func.isRequired,
    onCreateOrModifyItem: React.PropTypes.func.isRequired,
    onCreateItemAsAsset: React.PropTypes.func.isRequired,
    onDeleteItem: React.PropTypes.func.isRequired,
    submitOrder: React.PropTypes.func.isRequired,
    onSubmitItemsFilter: React.PropTypes.func.isRequired,
    onSubmitLogsFilter: React.PropTypes.func.isRequired,
    onCreateField: React.PropTypes.func.isRequired,
    // user info
    username: React.PropTypes.string.isRequired,
    userEmail: React.PropTypes.string.isRequired,
    displayName: React.PropTypes.string.isRequired,
    search: React.PropTypes.bool,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    includeStatusTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeStatusTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    setViewToItem: React.PropTypes.func.isRequired,
    setViewToUsers: React.PropTypes.func.isRequired,
    onChangeView: React.PropTypes.func.isRequired,
    updateUserPermission: React.PropTypes.func.isRequired,
    // cart
    onRemoveFromCart: React.PropTypes.func.isRequired,
    onSubmitCart: React.PropTypes.func.isRequired,
    cart: React.PropTypes.array.isRequired,
    // logs
    itemDetailObj: React.PropTypes.object.isRequired,
    setItemDetailViewItemObjAsync: React.PropTypes.func.isRequired,
    itemLogs: React.PropTypes.array,
    onOrderClick: React.PropTypes.func.isRequired,
    orderDetailObj: React.PropTypes.object,
    orderDetailRequests: React.PropTypes.array,
    processBundle: React.PropTypes.func.isRequired,
    onLogsClick: React.PropTypes.func.isRequired,
    globalLogs: React.PropTypes.array.isRequired,
    removeTag: React.PropTypes.func.isRequired,
    deleteField: React.PropTypes.func.isRequired,
    allTagObjects: React.PropTypes.array.isRequired,
    apiKey: React.PropTypes.string.isRequired,
    onBulkImport: React.PropTypes.func.isRequired,
    showPicker: React.PropTypes.func.isRequired,
    // emails
    subjectPrefix: React.PropTypes.string.isRequired,
    loanEmailBodyPrefix: React.PropTypes.string.isRequired,
    loanReminderDate: React.PropTypes.instanceOf(Date),
    onUpdateLoanReminderTemplate: React.PropTypes.func.isRequired,
    onUpdateSubjectPrefix: React.PropTypes.func.isRequired,
    onSetDateToSendLoanReminders: React.PropTypes.func.isRequired,
    onSubscribe: React.PropTypes.func.isRequired,
    onUnsubscribe: React.PropTypes.func.isRequired,
    subscribed: React.PropTypes.bool.isRequired,
    // backfill
    onBackfillFileUpload: React.PropTypes.func.isRequired,
    submitBackfillReceipt: React.PropTypes.func.isRequired,
    approveBackfill: React.PropTypes.func.isRequired,
    denyBackfill: React.PropTypes.func.isRequired,
    // minimum stock
    setMinStockThreshold: React.PropTypes.func.isRequired,
    convertCustomField: React.PropTypes.func.isRequired,
    filterMinThresh: React.PropTypes.bool.isRequired,
    toggleFilterMinThresh: React.PropTypes.func.isRequired,
    deleteInstanceField: React.PropTypes.func.isRequired,
    // instances
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
    setItemInstancesObjByItemIds: React.PropTypes.func.isRequired,
    deleteOrder: React.PropTypes.func.isRequired,
    userid: React.PropTypes.number.isRequired,
    onCreateInstance: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      users: [],
      orderDetailRequests: [],
      search: null,
      itemLogs: [],
      orderDetailObj: {},
    };
  },
  // =========================================================================
  // Nav bar view
  // =========================================================================
  getNavBarView() {
    return (
      <NavBar
        onItemsClick={this.props.onItemsViewClick}
        onLogoutClick={this.props.onLogoutClick}
        tags={this.props.allTags}
        statuses={this.props.statuses}
        view={this.props.currentView}
        onSearchRequestsClick={this.props.onSearchRequestsClick}
        onSearchItemsClick={this.props.onSearchItemsClick}
        onSearchLoansClick={this.props.onSearchLoansClick}
        onUserAccountInfoClick={this.props.onUserAccountInfoClick}
        permission={this.props.permission}
        username={this.props.username}
        userEmail={this.props.userEmail}
        displayName={this.props.displayName}
        onCreateOrModifyItem={this.props.onCreateOrModifyItem}
        onCreateUser={this.props.onCreateUser}
        excludeTags={this.props.excludeTags}
        includeTags={this.props.includeTags}
        excludeStatusTags={this.props.excludeStatusTags}
        includeStatusTags={this.props.includeStatusTags}
        onSubmitItemsFilter={this.props.onSubmitItemsFilter}
        onSubmitLogsFilter={this.props.onSubmitLogsFilter}
        onChangeView={this.props.onChangeView}
        onUsersClick={this.props.setViewToUsers}
        onOrdersClick={this.props.onOrdersClick}
        onLoansClick={this.props.onLoansClick}
        onLogsClick={this.props.onLogsClick}
        onBulkImport={this.props.onBulkImport}
        items={this.props.items}
        users={this.props.users}
        filterMinThresh={this.props.filterMinThresh}
        toggleFilterMinThresh={this.props.toggleFilterMinThresh}
      />
    );
  },
  // =========================================================================
  // Item detail view
  // =========================================================================
  setItemDetailViewItemObj(itemObj) {
    this.setState({
      itemDetailObj: itemObj,
    });
  },
  getItemListView() {
    return (
      <ItemList
        items={this.props.items}
        permission={this.props.permission}
        users={this.props.users}
        updateItem={this.props.onUpdateItem}
        deleteItem={this.props.onDeleteItem}
        allTags={this.props.allTags}
        submitOrder={this.props.submitOrder}
        setItemDetailViewItemObj={this.props.setItemDetailViewItemObjAsync}
        onItemClick={this.props.onItemClick}
        search={this.props.search}
        includeTags={this.props.includeTags}
        customFields={this.props.customFields}
        dispatchAsLoan={this.props.dispatchAsLoan}
        instancesObj={this.props.instancesObj}
        setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
      />
    );
  },
  // =========================================================================
  // Item detail view
  // =========================================================================
  getItemDetailView() {
    return (
      <ItemDetail
        key={this.props.itemDetailObj.id}
        itemDetailObj={this.props.itemDetailObj}
        allTags={this.props.allTags}
        permission={this.props.permission}
        users={this.props.users}
        updateItem={this.props.onUpdateItem}
        deleteItem={this.props.onDeleteItem}
        submitOrder={this.props.submitOrder}
        onConvertItemClick={this.props.onConvertItemClick}
        items={this.props.items}
        setViewToItem={this.props.setViewToItem}
        itemLogs={this.props.itemLogs}
        setViewToItemView={this.props.onItemsViewClick}
        onItemClick={this.props.onItemClick}
        onOrderClick={this.props.onOrderClick}
        customFields={this.props.customFields}
        instanceCustomFields={this.props.instanceCustomFields}
        orders={this.props.orders}
        instances={this.props.instances}
        deleteItemInstance={this.props.deleteItemInstance}
        updateItemInstance={this.props.updateItemInstance}
        // loans
        loans={this.props.itemLoans}
        onDisburseClick={this.props.disburseLoan}
        onReturnClick={this.props.returnLoan}
        dispatchAsLoan={this.props.dispatchAsLoan}
        onItemDetailTabClick={this.props.onItemDetailTabClick}
        instancesObj={this.props.instancesObj}
        setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
        onCreateInstance={this.props.onCreateInstance}
      />
    );
  },
  // =========================================================================
  // Users view
  // =========================================================================
  getUsersView() {
    return (
      <div className="navBarPadding">
        <UsersList
          users={this.props.users}
          updateUserPermission={this.props.updateUserPermission}
        />
      </div>
    );
  },
  // =========================================================================
  // New item view
  // =========================================================================
  getNewItemForm() {
    const isOpen = (this.props.currentView === VIEWS.NEWITEM);
    return (
      <div className="paddingRightAndLeft">
        <NewItemForm
          onCreateOrModifyItem={this.props.onCreateOrModifyItem}
          onCreateItemAsAsset={this.props.onCreateItemAsAsset}
          allTags={this.props.allTags}
          customFields={this.props.customFields}
          isOpen={isOpen}
          onClose={this.props.onChangeView.bind(null, VIEWS.ITEMS)}
        />
      </div>
    );
  },
  // =========================================================================
  // New user view
  // =========================================================================
  getNewUserView() {
    return (
      <div className="paddingRightAndLeft">
        <NewUserView
          onCreateUser={this.props.onCreateUser}
        />
      </div>
    );
  },
  getNewFieldView() {
    return (
      <div className="paddingRightAndLeft">
        <NewFieldView
          onCreateField={this.props.onCreateField}
        />
      </div>
    );
  },
  // =========================================================================
  // Orders view
  // =========================================================================
  getOrdersView() {
    return (
      <div className="paddingRightAndLeft">
        <OrderList
          orders={this.props.orders}
          onOrderClick={this.props.onOrderClick}
        />
      </div>
    );
  },
  getOrderDetailView() {
    return (
      <OrderDetail
        name={this.props.orderDetailObj.createdAt}
        order={this.props.orderDetailObj}
        requests={this.props.orderDetailRequests}
        permission={this.props.permission}
        processRequest={this.props.processBundle}
        setViewToOrdersView={this.props.onOrdersClick}
        onBundleReturnClick={this.props.onBundleReturnClick}
        onDisburseClick={this.props.disburseLoan}
        onReturnClick={this.props.returnLoan}
        disburseLoanBundle={this.props.disburseLoanBundle}
        onBackfillFileUpload={this.props.onBackfillFileUpload}
        submitBackfillReceipt={this.props.submitBackfillReceipt}
        approveBackfill={this.props.approveBackfill}
        denyBackfill={this.props.denyBackfill}
        instancesObj={this.props.instancesObj}
        setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
        deleteOrder={this.props.deleteOrder}
        userid={this.props.userid}
      />
    );
  },
  // =========================================================================
  // Cart view
  // =========================================================================
  getCartView() {
    return (
      <div className="paddingRightAndLeft">
        <CartView
          onRemoveFromCart={this.props.onRemoveFromCart}
          onSubmitCart={this.props.onSubmitCart}
          cart={this.props.cart}
        />
      </div>
    );
  },
  getLogsView() {
    return (
      <div className="paddingRightAndLeft">
        <LogList
          itemLogs={this.props.globalLogs}
          onItemClick={this.props.onItemClick}
          onOrderClick={this.props.onOrderClick}
          hideItemButton={false}
        />
      </div>
    );
  },
  getTagsView() {
    return (
      <div className="paddingRightAndLeft navBarPadding">
        <TagsList
          tags={this.props.allTagObjects}
          deleteTag={this.props.removeTag}
        />
      </div>
    );
  },
  getFieldsView() {
    return (
      <div className="paddingRightAndLeft navBarPadding">
        <FieldsListView
          fields={this.props.customFields}
          instanceFields={this.props.instanceCustomFields}
          deleteField={this.props.deleteField}
          deleteInstanceField={this.props.deleteInstanceField}
          convertCustomField={this.props.convertCustomField}
        />
      </div>
    );
  },
  getSubscribeButton() {
    if (this.props.subscribed) {
      return (
        <button
          className="addToCartButton pt-button pt-intent-primary"
          onClick={this.props.onUnsubscribe}
        >
          Unsubscribe from emails
        </button>
      );
    }
    return (
      <button
        className="addToCartButton pt-button pt-intent-primary"
        onClick={this.props.onSubscribe}
      >
        Subscribe to emails
      </button>
    );
  },
  getAccountInfoView() {
    // TODO Pull this out into its own component asap
    const URL = configAccessor.getUrl();
    const docsURL = `${URL}docs`;

    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Account info'}</h3>
        </div>
        <div className="newItemFormInner">
          <label htmlFor={'user'} className="formLabel pt-label">
            <b>User: </b> {this.props.displayName}
          </label>
          {(this.props.permission !== PERMISSIONS.USER) &&
            <label htmlFor={'priviledge'} className="formLabel pt-label">
              <b>Privilege: </b> {this.props.permission}
            </label>
          }
          <label htmlFor={'user'} className="formLabel pt-label">
            <b>API key: </b>
            <textarea className="apiKey" value={this.props.apiKey} readOnly />
          </label>
          <div className="accountInfoElement">
            <b>
              <a
                href={docsURL}
                target="_blank"
                rel="noreferrer noopener"
              >
                API Guide
              </a>
            </b>
          </div>
          {(this.props.permission !== PERMISSIONS.USER) &&
          <label htmlFor={'emails'} className="formLabel pt-label">
            Email subscription:
              {this.getSubscribeButton()}
          </label>
          }
        </div>
      </div>
    );
  },
  getBulkImportView() {
    return (
      <div className="paddingRightAndLeft">
        <BulkImportView
          showPicker={this.props.showPicker}
        />
      </div>
    );
  },
  getLoansView() {
    return (
      <div className="paddingRightAndLeft">
        <LoanList
          loans={this.props.loans}
          permission={this.props.permission}
          onDisburseClick={this.props.disburseLoan}
          onReturnClick={this.props.returnLoan}
        />
      </div>
    );
  },
  getEmailsView() {
    return (
      <div className="paddingRightAndLeft">
        <EmailView
          subjectPrefix={this.props.subjectPrefix}
          loanEmailBodyPrefix={this.props.loanEmailBodyPrefix}
          loanReminderDate={this.props.loanReminderDate}
          onUpdateLoanReminderTemplate={this.props.onUpdateLoanReminderTemplate}
          onUpdateSubjectPrefix={this.props.onUpdateSubjectPrefix}
          onSetDateToSendLoanReminders={this.props.onSetDateToSendLoanReminders}
        />
      </div>
    );
  },
  getMinimumStockView() {
    return (
      <div>
        <MinimumStockListView
          items={this.props.items}
          setMinStockThreshold={this.props.setMinStockThreshold}
        />
      </div>
    );
  },
  render() {
    const displayItemListView = (this.props.currentView === VIEWS.ITEMS);
    const displayItemDetailView = (this.props.currentView === VIEWS.ITEMDETAIL);
    const displayNewItemForm = (this.props.currentView === VIEWS.NEWITEM);
    const displayNewUserView = (this.props.currentView === VIEWS.NEWUSER);
    const displayUsersView = (this.props.currentView === VIEWS.USERS);
    const displayOrdersView = (this.props.currentView === VIEWS.ORDERS);
    const displayOrderDetailView = (this.props.currentView === VIEWS.ORDERDETAIL);
    const displayCartView = (this.props.currentView === VIEWS.CART);
    const displayLogsView = (this.props.currentView === VIEWS.LOGS);
    const displayTagsView = (this.props.currentView === VIEWS.TAGS);
    const displayAccountView = (this.props.currentView === VIEWS.ACCOUNTINFO);
    const displayNewFieldView = (this.props.currentView === VIEWS.NEWFIELD);
    const displayFieldsView = (this.props.currentView === VIEWS.FIELDS);
    const displayBulkImportView = (this.props.currentView === VIEWS.BULKIMPORT);
    const displayLoansView = (this.props.currentView === VIEWS.LOANS);
    const displayEmailConfigView = (this.props.currentView === VIEWS.CONFIGEMAIL);
    const displayMinimumStockView = (this.props.currentView === VIEWS.MINIMUMSTOCK);

    return (
      <div className="userView">
        {this.getNavBarView()}
        {displayItemListView &&
          this.getItemListView()
        }
        {displayItemDetailView &&
          this.getItemDetailView()
        }
        {displayNewItemForm &&
          this.getNewItemForm()
        }
        {displayNewUserView &&
          this.getNewUserView()
        }
        {displayUsersView && (this.props.permission === PERMISSIONS.ADMIN) &&
          this.getUsersView()
        }
        {displayOrdersView &&
          this.getOrdersView()
        }
        {displayOrderDetailView &&
          this.getOrderDetailView()
        }
        {displayCartView &&
          this.getCartView()
        }
        {displayLogsView &&
          this.getLogsView()
        }
        {displayTagsView &&
          this.getTagsView()
        }
        {displayAccountView &&
          this.getAccountInfoView()
        }
        {displayNewFieldView &&
          this.getNewFieldView()
        }
        {displayFieldsView &&
          this.getFieldsView()
        }
        {displayBulkImportView &&
          this.getBulkImportView()
        }
        {displayLoansView &&
          this.getLoansView()
        }
        {displayEmailConfigView &&
          this.getEmailsView()
        }
        {displayMinimumStockView &&
          this.getMinimumStockView()
        }
      </div>
    );
  },
});

module.exports = MasterView;
