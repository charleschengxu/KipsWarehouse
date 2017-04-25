const _ = require('lodash');
const React = require('react');
const RequestList = require('./requestList.js');
const PendingRequestActionPopover = require('./../components/popovers/pendingRequestActionPopover.js');
const RequestBackfillPopover = require('./../components/popovers/requestBackfillPopover.js');
const PERMISSIONS = require('./../enums/permissions.js');
const TYPE = require('./../enums/type.js');
const STATUS = require('./../enums/status.js');

const OrderDetail = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    order: React.PropTypes.object.isRequired,
    requests: React.PropTypes.array.isRequired,
    permission: React.PropTypes.string.isRequired,
    processRequest: React.PropTypes.func.isRequired,
    setViewToOrdersView: React.PropTypes.func.isRequired,
    onBundleReturnClick: React.PropTypes.func.isRequired,
    onDisburseClick: React.PropTypes.func.isRequired,
    onReturnClick: React.PropTypes.func.isRequired,
    disburseLoanBundle: React.PropTypes.func.isRequired,
    // Backfill
    onBackfillFileUpload: React.PropTypes.func.isRequired,
    submitBackfillReceipt: React.PropTypes.func.isRequired,
    approveBackfill: React.PropTypes.func.isRequired,
    denyBackfill: React.PropTypes.func.isRequired,
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
  },
  getDateString() {
    const date = new Date(this.props.order.createdAt);
    const displayMonth = date.getMonth() + 1;
    const displayDay = date.getDate();
    const displayYear = date.getFullYear();
    return `${displayMonth}/${displayDay}/${displayYear}`;
  },
  handleBundleReturnClick() {
    this.props.onBundleReturnClick(this.props.order.id);
  },
  handleBundleDisburseClick() {
    this.props.disburseLoanBundle();
  },
  handleDeleteClick() {
    this.props.deleteOrder(this.props.order.id);
  },
  render() {
    const approvedLoans = _.filter(this.props.requests, { orderType: 'LOAN', orderStatus: 'APPROVED' });
    const name = `${this.props.order.displayName}'s request ${this.props.order.id} on ${this.getDateString()} `;
    const isPriviledgedUser = (this.props.permission === PERMISSIONS.ADMIN)
      || (this.props.permission === PERMISSIONS.MANAGER);
    const showRequestProcessButton = isPriviledgedUser &&
      (this.props.order.bundleStatus === STATUS.PENDING);
    const showLoanProcessButton = isPriviledgedUser &&
      (this.props.order.bundleStatus === STATUS.APPROVED) &&
      (this.props.order.bundleType === TYPE.LOAN);
    const showRequestBackfillButton = (this.props.permission === PERMISSIONS.USER) &&
      (this.props.order.bundleStatus === STATUS.APPROVED ||
        this.props.order.bundleStatus === STATUS.PENDING) &&
      (this.props.order.bundleType === TYPE.LOAN) &&
      approvedLoans.length > 0;
    const showDeleteButton = (this.props.order.bundleStatus === STATUS.PENDING) &&
    (this.props.userid === this.props.order.userId);

    return (
      <div className="itemDetail">
        <div className="itemDetailViewHeader">
          <button
            type="button"
            className="pt-button pt-minimal backButton pt-icon-arrow-left"
            onClick={this.props.setViewToOrdersView}
          />
          <h3 className="itemLabelDetail">{name}</h3>
          {showRequestProcessButton &&
          <PendingRequestActionPopover
            name={name}
            id={this.props.order.id}
            quantity={1}
            requests={this.props.requests}
            processRequest={this.props.processRequest}
            bundleType={this.props.order.bundleType}
            instancesObj={this.props.instancesObj}
            setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
          />
          }
          {showLoanProcessButton &&
            <div className="addToCart">
              <button
                className="addToCartButton pt-button pt-intent-primary goToButton"
                onClick={this.handleBundleReturnClick}
              >
                Returned
              </button>
              <button
                className="addToCartButton pt-button goToButton"
                onClick={this.handleBundleDisburseClick}
              >
                Disburse
              </button>
            </div>
          }
          {showDeleteButton &&
            <div className="addToCart">
              <button
                className="addToCartButton pt-button pt-intent-danger goToButton"
                onClick={this.handleDeleteClick}
              >
                Delete
              </button>
            </div>
          }
          {showRequestBackfillButton &&
          <RequestBackfillPopover
            onBackfillFileUpload={this.props.onBackfillFileUpload}
            requests={this.props.requests}
            submitBackfillReceipt={this.props.submitBackfillReceipt}
          />
          }
        </div>
        <div className="itemParametersDetail">
          <div className="locationAndModelLabelDetail locationAndModelLabel">
            <label htmlFor={'orderBy'} className="modelLabelDetail pt-running-text-small">
              <b>Ordered By: </b>
            </label>
            <label htmlFor={this.props.order.displayName} className="pt-running-text-small">
              {this.props.order.displayName}
            </label>
          </div>
          {this.props.order.userComment &&
            <div className="locationAndModelLabelDetail locationAndModelLabel">
              <label htmlFor={'userComment'} className="tagsLabelDetail pt-running-text-small">
                <b>User Comment: </b>
              </label>
              <div>
                <label htmlFor={'userComment'} className="pt-running-text-small">
                  {this.props.order.userComment}
                </label>
              </div>
            </div>
          }

          {this.props.order.adminComment &&
            <div className="locationAndModelLabelDetail locationAndModelLabel">
              <label htmlFor={'adminComment'} className="tagsLabelDetail pt-running-text-small">
                <b>Admin Comment: </b>
              </label>
              <div>
                <label htmlFor={'adminComment'} className="pt-running-text-small">
                  {this.props.order.adminComment}
                </label>
              </div>
            </div>
          }
        </div>

        <div>
          <h4 className="itemLabelDetail requestsHeaderDetail">Items</h4>
          <RequestList
            requests={this.props.requests}
            permission={this.props.permission}
            processRequest={this.props.processRequest}
            hideNonIdealState="hello"
            hideProcessButton
            onDisburseClick={this.props.onDisburseClick}
            onReturnClick={this.props.onReturnClick}
            approveBackfill={this.props.approveBackfill}
            denyBackfill={this.props.denyBackfill}
          />
        </div>
      </div>
    );
  },
});

module.exports = OrderDetail;
