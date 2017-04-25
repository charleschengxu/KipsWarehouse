const _ = require('lodash');
const React = require('react');
const OrderEntry = require('./../components/cards/orderEntry.js');

const OrderList = React.createClass({
  propTypes: {
    orders: React.PropTypes.array.isRequired,
    onOrderClick: React.PropTypes.func.isRequired,
    addPadding: React.PropTypes.bool,
    hideNonIdealState: React.PropTypes.bool,
  },
  getDefaultProps() {
    return {
      addPadding: true,
      hideNonIdealState: false,
    };
  },
  getNoLoansDialog() {
    return (
      <div>
        {!this.props.hideNonIdealState &&
          <div className="nonIdealState pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
              <span className="pt-icon pt-icon-folder-open" />
            </div>
            <h4 className="pt-non-ideal-state-title">No requests have been submitted</h4>
          </div>
        }
      </div>
    );
  },
  getOrderEntry(order) {
    const boundClick = this.loadOrderDetailView.bind(null, order.id);
    return (
      <div className="itemWrapper pt-card pt-interactive" key={order.id} onClick={boundClick}>
        <OrderEntry
          userId={order.userId}
          displayName={order.displayName}
          orderDate={order.createdAt}
          orderStatus={order.bundleStatus}
          bundleType={order.bundleType}
          bundleId={order.id}
          backfillStatus={order.backfillStatus}
        />
      </div>
    );
  },
  loadOrderDetailView(orderId) {
    this.props.onOrderClick(orderId);
  },
  render() {
    const requestListEmpty = _.isEmpty(this.props.orders);
    const className = this.props.addPadding ? 'logListContainer navBarPadding' : 'logListContainer';
    return (
      <div className={className}>
        {requestListEmpty ? this.getNoLoansDialog() : _.map(this.props.orders, this.getOrderEntry)}
      </div>
    );
  },
});

module.exports = OrderList;
