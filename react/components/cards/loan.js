const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const PERMISSIONS = require('./../../enums/permissions.js');
const STATUS = require('./../../enums/status.js');

const Loan = React.createClass({
  propTypes: {
    id: React.PropTypes.number.isRequired,
    bundleId: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    quantity: React.PropTypes.number.isRequired,
    requestStatus: React.PropTypes.string.isRequired,
    userComment: React.PropTypes.string,
    adminComment: React.PropTypes.string,
    displayName: React.PropTypes.string.isRequired,
    onDisburseClick: React.PropTypes.func.isRequired,
    onReturnClick: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
    showTag: React.PropTypes.string,
    backfillStatus: React.PropTypes.string,
    fileHandles: React.PropTypes.array,
    approveBackfill: React.PropTypes.func,
    denyBackfill: React.PropTypes.func,
    instances: React.PropTypes.arrayOf(React.PropTypes.shape({
      assetTag: React.PropTypes.number,
      createdAt: React.PropTypes.string,
      id: React.PropTypes.number,
      instanceStatus: React.PropTypes.string,
      itemId: React.PropTypes.number,
      updatedAt: React.PropTypes.string,
    })),
  },
  getDefaultProps() {
    return {
      userComment: '',
      adminComment: '',
    };
  },
  getInitialState() {
    return {
      isOpen: false,
      loaded: false,
      popoverOpen: false,
    };
  },
  getStatusTag() {
    let statusClassName = 'statusTag loanTag pt-tag';
    switch (this.props.requestStatus) {
      case STATUS.APPROVED:
        statusClassName += ' pt-intent-success';
        break;
      case STATUS.PENDING:
        statusClassName += ' pt-intent-danger';
        break;
      default:
        break;
    }
    return (<span className={statusClassName}>{this.props.requestStatus}</span>);
  },
  getFileHandleLinks() {
    return (_.map(this.props.fileHandles, this.getLinkFromHandle));
  },
  getLinkFromHandle(handle) {
    let url = 'https://cdn.filestackcontent.com/';
    url += handle.fileHandle;
    return (<a key={handle.fileName} target="_blank" rel="noopener noreferrer" href={url}> {handle.fileName} </a>);
  },
  cancelDelete() {
    this.setState({ isOpen: false });
  },
  handleDisburseClick() {
    this.props.onDisburseClick(this.props.id);
  },
  handleReturnClick() {
    this.props.onReturnClick(this.props.id);
  },
  togglePopoverVisibility() {
    this.setState({ popoverOpen: !this.state.popoverOpen });
  },
  approveBackfill() {
    this.props.approveBackfill(this.props.id);
  },
  denyBackfill() {
    this.props.denyBackfill(this.props.id);
  },
  getPopoverContents() {
    return (
      <div className="buttonPopover">
        <button
          className="confirmRequestButton backfillButton pt-button pt-intent-success"
          onClick={this.approveBackfill}
        >
          Approve
        </button>
        <button
          className="confirmRequestButton backfillButton pt-button pt-intent-danger"
          onClick={this.denyBackfill}
        >
          Deny
        </button>
      </div>
    );
  },
  render() {
    const requestLabel = this.props.name;
    const isManager = (this.props.permission === PERMISSIONS.MANAGER);
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isPriviledgedUser = isManager || isAdmin;
    const showButtons = this.props.requestStatus === STATUS.DISPATCHED
     || this.props.requestStatus === STATUS.APPROVED;
    const backfillPending = this.props.backfillStatus === STATUS.PENDING;
    const assetTags = _.map(this.props.instances, instance => instance.assetTag).join(', ');
    const showInstances = !(_.isEmpty(this.props.instances));
    return (
      <div className="item">
        <label htmlFor={'requestLabel'} className="requestLabel pt-ui-text-large">{requestLabel}</label>
        {this.props.showTag &&
          <span className="statusTag loanTag pt-tag pt-intent-warning">LOAN</span>
        }
        {this.props.showTag &&
          this.getStatusTag()
        }
        {this.props.backfillStatus &&
          <span className="statusTag loanTag pt-tag">BACKFILL {this.props.backfillStatus}</span>
        }
        <div className="addToCart">
          {isPriviledgedUser && showButtons && backfillPending &&
            <div className="submitRequestPopover pt-popover-dismiss">
              <Blueprint.Popover
                content={this.getPopoverContents()}
                position={Blueprint.Position.TOP}
                isOpen={this.state.popoverOpen}
              >
                <button
                  className="addToCartButton pt-button"
                  disabled={false}
                  onClick={this.togglePopoverVisibility}
                >
                  Process Backfill
                </button>
              </Blueprint.Popover>
            </div>
          }
          {isPriviledgedUser && showButtons &&
          <button
            className="addToCartButton pt-button pt-intent-primary goToButton"
            onClick={this.handleReturnClick}
          >
            Returned
          </button>
          }
          {isPriviledgedUser && showButtons &&
          <button
            className="addToCartButton pt-button goToButton"
            onClick={this.handleDisburseClick}
          >
            Disburse
          </button>
          }
        </div>
        <label htmlFor={'displayName'} className="orderNumberLabel pt-running-text-small">{`Loaned to: ${this.props.displayName}`}</label>
        {!this.props.showTag &&
          <label htmlFor={'orderId'} className="orderNumberLabel pt-running-text-small">{`Loan ID: ${this.props.id} (Order ID: ${this.props.bundleId})`}</label>
        }
        {this.props.showTag &&
          <label htmlFor={'orderId'} className="orderNumberLabel pt-running-text-small">{`Loan ID: ${this.props.id}`}</label>
        }
        <label htmlFor={'quantity'} className="quantityLabel pt-running-text-small">{`Quantity: ${this.props.quantity}`}</label>
        {showInstances &&
          <label htmlFor={'instances'} className="quantityLabel pt-running-text-small">{`Instances: ${assetTags}`}</label>
        }
        {this.props.userComment &&
        <label
          htmlFor={'userComment'}
          className="userReasonLabel pt-running-text-small"
        >
          {`User Note: ${this.props.userComment}`}
        </label>}
        {this.props.adminComment &&
        <label
          htmlFor={'adminComment'}
          className="adminReasonLabel pt-running-text-small"
        >
          {`Admin Note: ${this.props.adminComment}`}
        </label>}
        {this.props.fileHandles &&
          <div>
            <label
              htmlFor={'adminComment'}
              className="adminReasonLabel pt-running-text-small"
            >
              {'Backfill receipt(s):'}
              {this.getFileHandleLinks()}
            </label>
          </div>
        }
      </div>
    );
  },
});

module.exports = Loan;
