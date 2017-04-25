const React = require('react');
const STATUS = require('./../../enums/status.js');
const TYPE = require('./../../enums/type.js');

const OrderEntry = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string.isRequired,
    orderDate: React.PropTypes.string.isRequired,
    orderStatus: React.PropTypes.string.isRequired,
    bundleType: React.PropTypes.string.isRequired,
    bundleId: React.PropTypes.number.isRequired,
    backfillStatus: React.PropTypes.string,
  },
  getStatusTag() {
    let statusClassName = 'statusTag loanTag pt-tag';
    switch (this.props.orderStatus) {
      case STATUS.APPROVED:
        statusClassName += ' pt-intent-success';
        break;
      case STATUS.PENDING:
        statusClassName += ' pt-intent-danger';
        break;
      default:
        break;
    }
    return (<span className={statusClassName}>{this.props.orderStatus}</span>);
  },
  getTypeTag() {
    let statusClassName = 'statusTag pt-tag';
    switch (this.props.bundleType) {
      case TYPE.LOAN:
        statusClassName += ' pt-intent-warning';
        break;
      case TYPE.DISBURSE:
        statusClassName += ' pt-intent-primary';
        break;
      default:
        break;
    }
    return (<span className={statusClassName}>{this.props.bundleType}</span>);
  },
  getDateString() {
    const date = new Date(this.props.orderDate);
    const displayMonth = date.getMonth() + 1;
    const displayDay = date.getDate();
    const displayYear = date.getFullYear();
    return `${displayMonth}/${displayDay}/${displayYear}`;
  },
  render() {
    const dateString = this.getDateString();
    const name = `${this.props.displayName}'s request ${this.props.bundleId} on ${dateString} `;
    return (
      <div className="item">
        {name}
        {this.getTypeTag()}
        {this.getStatusTag()}
        {this.props.backfillStatus &&
          <span className="statusTag loanTag pt-tag">BACKFILL {this.props.backfillStatus}</span>
        }
      </div>
    );
  },
});

module.exports = OrderEntry;
