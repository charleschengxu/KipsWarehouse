const React = require('react');
const _ = require('lodash');
const STATUS = require('./../../enums/status.js');

const Request = React.createClass({
  propTypes: {
    id: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    quantity: React.PropTypes.number.isRequired,
    userComment: React.PropTypes.string,
    adminComment: React.PropTypes.string,
    requestStatus: React.PropTypes.string.isRequired,
    showTag: React.PropTypes.string,
    instances: React.PropTypes.arrayOf(React.PropTypes.shape({
      assetTag: React.PropTypes.number,
      createdAt: React.PropTypes.string,
      id: React.PropTypes.number,
      instanceStatus: React.PropTypes.string,
      itemId: React.PropTypes.number,
      updatedAt: React.PropTypes.string,
    })),
    backfillStatus: React.PropTypes.string,
    fileHandles: React.PropTypes.array,
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
  closePopover() {
    this.setState({ isOpen: false });
  },
  handlePopoverInteraction() {
    const nextState = !this.state.isOpen;
    this.setState({ isOpen: nextState });
  },
  handleDeleteClick() {
    this.setState({ isOpen: true });
  },
  cancelDelete() {
    this.setState({ isOpen: false });
  },
  getFileHandleLinks() {
    return (_.map(this.props.fileHandles, this.getLinkFromHandle));
  },
  getLinkFromHandle(handle) {
    let url = 'https://cdn.filestackcontent.com/';
    url += handle.fileHandle;
    return (<a key={handle.fileName} target="_blank" rel="noopener noreferrer" href={url}> {handle.fileName} </a>);
  },
  render() {
    const requestLabel = this.props.name;
    const assetTags = _.map(this.props.instances, instance => instance.assetTag).join(', ');
    const showInstances = !(_.isEmpty(this.props.instances));
    return (
      <div className="request">
        <label htmlFor={'requestLabel'} className="requestLabel pt-ui-text-large">{requestLabel}</label>
        {this.props.showTag &&
          <span className="statusTag loanTag pt-tag pt-intent-primary">DISBURSE</span>
        }
        {this.props.showTag &&
          this.getStatusTag()
        }
        {this.props.backfillStatus &&
          <span className="statusTag loanTag pt-tag">BACKFILL {this.props.backfillStatus}</span>
        }
        <div className="requestItemParameters">
          <label htmlFor={'orderId'} className="orderNumberLabel pt-running-text-small">{`Order ID: ${this.props.id}`}</label>
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
        </div>
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

module.exports = Request;
