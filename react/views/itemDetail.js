const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const ItemTags = require('./../components/tagging/itemTags.js');
const SubmitRequestPopover = require('./../components/popovers/submitRequestPopover.js');
const DispatchToUser = require('./../components/popovers/dispatchToUser.js');
const ModifyItemPopover = require('./../components/popovers/modifyItemPopover.js');
const DeleteItemPopover = require('./../components/popovers/deleteItemPopover.js');
const ConvertItemPopover = require('./../components/popovers/convertItemPopover.js');
const LogList = require('./logList.js');
const LoanList = require('./loanList.js');
const OrderList = require('./orderList.js');
const InstanceList = require('./instanceList.js');
const PERMISSIONS = require('./../enums/permissions.js');
const VISIBILITY = require('./../enums/visibility.js');
const VIEWS = require('./../enums/views.js');

const ItemDetail = React.createClass({
  propTypes: {
    itemDetailObj: React.PropTypes.object.isRequired,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    permission: React.PropTypes.string.isRequired,
    users: React.PropTypes.array,
    updateItem: React.PropTypes.func.isRequired,
    deleteItem: React.PropTypes.func.isRequired,
    submitOrder: React.PropTypes.func.isRequired,
    onConvertItemClick: React.PropTypes.func.isRequired,
    setViewToItem: React.PropTypes.func.isRequired,
    itemLogs: React.PropTypes.array,
    setViewToItemView: React.PropTypes.func.isRequired,
    onItemClick: React.PropTypes.func.isRequired,
    onOrderClick: React.PropTypes.func.isRequired,
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
    loans: React.PropTypes.array.isRequired,
    instances: React.PropTypes.array.isRequired,
    updateItemInstance: React.PropTypes.func.isRequired,
    deleteItemInstance: React.PropTypes.func.isRequired,
    onDisburseClick: React.PropTypes.func.isRequired,
    onReturnClick: React.PropTypes.func.isRequired,
    dispatchAsLoan: React.PropTypes.func.isRequired,
    onItemDetailTabClick: React.PropTypes.func.isRequired,
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
    setItemInstancesObjByItemIds: React.PropTypes.func.isRequired,
    onCreateInstance: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      users: [],
      itemLogs: [],
    };
  },
  getFieldsDataFromItemObj(itemObj) {
    // HACK we are hard coding removing keys from itemObj that
    // are not item fields. This should be replaced with a
    // less hacky way of feeding an object of fields & current
    // values for an item.
    const fieldsObj = {};
    _.forEach(itemObj, (value, key) => {
      const doNotAdd = (key === 'itemStatus') || (key === 'id');
      if (doNotAdd) {
        return;
      }
      fieldsObj[key] = value;
    });
    return fieldsObj;
  },
  getFields() {
    const fieldsObj = this.getFieldsDataFromItemObj(this.props.itemDetailObj);
    return _.map(fieldsObj, (value, key) => {
      if ((key === 'name') || (key === 'tags')) {
        return null;
      }
      if (this.props.customFields[_.findIndex(this.props.customFields, ['name', key])]) {
        if ((this.props.customFields[_.findIndex(this.props.customFields, ['name', key])].visibility === VISIBILITY.PRIVATE) && (this.props.permission === PERMISSIONS.USER)) {
          return null;
        }
      }
      const displayValue = (_.isNull(value) || value === '') ? 'N/A' : value;
      // TODO handle private fields
      return (
        <div className="locationAndModelLabelDetail locationAndModelLabel" key={key}>
          <label htmlFor={'modelLabelDetail'} className="modelLabelDetail pt-running-text-small">
            <b>{`${key} : `}</b>
          </label>
          <label htmlFor={'displayValue'} className="pt-running-text-small">{displayValue}</label>
        </div>
      );
    });
  },
  onTabsChange(newTabId) {
    this.props.onItemDetailTabClick(newTabId, this.props.itemDetailObj.id);
  },
  getTabs() {
    const orderList = _.isEmpty(this.props.orders) ?
      'No requests have been made for this item.' :
      (
        <OrderList
          orders={this.props.orders}
          onOrderClick={this.props.onOrderClick}
          addPadding={false}
          hideNonIdealState
        />
    );
    const loans = _.isEmpty(this.props.loans) ?
      'No loans have been created for this item.' :
      (
        <LoanList
          loans={this.props.loans}
          permission={this.props.permission}
          onDisburseClick={this.props.onDisburseClick}
          onReturnClick={this.props.onReturnClick}
          hideNonIdealState={'hide'}
          addPadding={false}
        />
      );
    const logs = _.isEmpty(this.props.itemLogs) ?
      'No logs have been created for this item.' :
      (
        <LogList
          itemLogs={this.props.itemLogs}
          onItemClick={this.props.onItemClick}
          hideItemButton
          onOrderClick={this.props.onOrderClick}
          addPadding={false}
        />
      );
    const instanceList = _.isEmpty(this.props.instances) ?
      'No instances have been created for this item.' :
      (
        <InstanceList
          instances={this.props.instances}
          instanceCustomFields={this.props.instanceCustomFields}
          updateItemInstance={this.props.updateItemInstance}
          deleteItemInstance={this.props.deleteItemInstance}
          permission={this.props.permission}
        />
    );
    const isManager = (this.props.permission === PERMISSIONS.MANAGER);
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isPrivilegedUser = isAdmin || isManager;
    const isAsset = (this.props.itemDetailObj.isAsset === 1);
    const boundClick = this.props.onCreateInstance.bind(null, this.props.itemDetailObj.id);
    return (
      <div className="detailTabs">
        <Blueprint.Tabs2
          animate
          className="detailTabs"
          defaultSelectedTabId={VIEWS.ORDERS}
          id="itemDetailTabs2"
          key={'horizontal'}
          onChange={this.onTabsChange}
        >
          <Blueprint.Tab2 className="requestsTab" id={VIEWS.ORDERS} title="Requests" panel={orderList} />
          <Blueprint.Tab2 className="loansTab" id={VIEWS.LOANS} title="Loans" panel={loans} />
          {isAsset &&
            <Blueprint.Tab2 className="instancesTab" id={VIEWS.INSTANCES} title="Assets" panel={instanceList} />
          }
          {isPrivilegedUser &&
            <Blueprint.Tab2 className="logsTab" id={VIEWS.LOGS} title="Logs" panel={logs} />
          }
          <Blueprint.Tabs2.Expander />
          {(isAsset && isPrivilegedUser) &&
            <div className="addAssetButton">
              <button
                className="addToCartButton pt-intent-success pt-button pt-minimal"
                onClick={boundClick}
              >
              Add asset
              </button>
            </div>
          }
        </Blueprint.Tabs2>
      </div>
    );
  },
  handleConvertItemClick(id) {
    this.props.onConvertItemClick(id);
  },
  handleDeleteItemClick(id) {
    this.props.setViewToItem();
    this.props.deleteItem(id);
  },
  render() {
    const initialQuantity = 1;
    const isManager = (this.props.permission === PERMISSIONS.MANAGER);
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isUser = (this.props.permission === PERMISSIONS.USER);
    const isPrivilegedUser = isAdmin || isManager;
    const fieldsObj = this.getFieldsDataFromItemObj(this.props.itemDetailObj);
    return (
      <div className="itemDetail">
        <div className="itemDetailViewHeader">
          <button
            type="button"
            className="pt-button pt-minimal backButton pt-icon-arrow-left"
            onClick={this.props.setViewToItemView}
          />
          <h3 className="itemLabelDetail">{this.props.itemDetailObj.name}</h3>
          {isUser &&
            <div className="addToCart">
              <SubmitRequestPopover
                name={this.props.itemDetailObj.name}
                id={this.props.itemDetailObj.id}
                maxQuantity={this.props.itemDetailObj.quantity}
                quantity={initialQuantity}
                submitOrder={this.props.submitOrder}
              />
            </div>
          }
          {(isPrivilegedUser && !this.props.itemDetailObj.isAsset) &&
          <ConvertItemPopover
            name={this.props.itemDetailObj.name}
            id={this.props.itemDetailObj.id}
            onConvertItemClick={this.handleConvertItemClick}
          />
          }
          {isAdmin &&
          <DeleteItemPopover
            id={this.props.itemDetailObj.id}
            name={this.props.itemDetailObj.name}
            onDeleteItemClick={this.handleDeleteItemClick}
          />
          }
          {isPrivilegedUser &&
          <ModifyItemPopover
            id={this.props.itemDetailObj.id}
            name={this.props.itemDetailObj.name}
            quantity={this.props.itemDetailObj.quantity}
            activeTags={this.props.itemDetailObj.tags}
            allTags={this.props.allTags}
            onUpdateItem={this.props.updateItem}
            customFields={this.props.customFields}
            fieldsData={fieldsObj}
            isManager={isManager}
            isAsset={this.props.itemDetailObj.isAsset}
          />
          }
          {isPrivilegedUser &&
          <DispatchToUser
            maxQuantity={this.props.itemDetailObj.quantity}
            initialQuantity={initialQuantity}
            id={this.props.itemDetailObj.id}
            name={this.props.itemDetailObj.name}
            users={this.props.users}
            dispatchItem={this.props.submitOrder}
            dispatchAsLoan={this.props.dispatchAsLoan}
            isAsset={this.props.itemDetailObj.isAsset}
            instancesObj={this.props.instancesObj}
            setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
          />
          }
        </div>
        <div className="itemParametersDetail">
          {this.getFields()}
          <div className="locationAndModelLabelDetail locationAndModelLabel">
            <label htmlFor={'tagsLabelDetail'} className="tagsLabelDetail pt-running-text-small">
              <b>Tags: </b>
            </label>
            <ItemTags
              tags={this.props.itemDetailObj.tags}
              permission={this.props.permission}
            />
            {this.props.itemDetailObj.tags.length === 0 &&
              'N/A'
            }
          </div>
        </div>
        <div>
          {this.getTabs()}
        </div>
      </div>
    );
  },
});

module.exports = ItemDetail;
