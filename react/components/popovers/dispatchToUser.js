const React = require('react');
const DispatchPopover = require('./dispatchPopover.js');

// Admin equivalent of addToCart
// TODO combine this with addToCart
const DispatchToUser = React.createClass({
  propTypes: {
    maxQuantity: React.PropTypes.number.isRequired,
    id: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    users: React.PropTypes.array.isRequired,
    dispatchItem: React.PropTypes.func.isRequired,
    dispatchAsLoan: React.PropTypes.func.isRequired,
    isAsset: React.PropTypes.number.isRequired,
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
    setItemInstancesObjByItemIds: React.PropTypes.func.isRequired,
  },
  render() {
    return (
      <div className="addToCart">
        <DispatchPopover
          name={this.props.name}
          id={this.props.id}
          maxQuantity={this.props.maxQuantity}
          users={this.props.users}
          enabled={(this.props.maxQuantity > 0)}
          dispatchItem={this.props.dispatchItem}
          dispatchAsLoan={this.props.dispatchAsLoan}
          isAsset={this.props.isAsset}
          instancesObj={this.props.instancesObj}
          setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
        />
      </div>
    );
  },
});

module.exports = DispatchToUser;
