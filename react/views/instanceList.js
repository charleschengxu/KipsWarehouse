const _ = require('lodash');
const React = require('react');
const InstanceEntry = require('./../components/cards/instanceEntry.js');
const PERMISSIONS = require('./../enums/permissions.js');

const InstanceList = React.createClass({
  propTypes: {
    instances: React.PropTypes.array.isRequired,
    instanceCustomFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string,
      visibility: React.PropTypes.string,
      type: React.PropTypes.string,
    })).isRequired,
    updateItemInstance: React.PropTypes.func.isRequired,
    deleteItemInstance: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getInstance(instanceObj) {
    return (
      <div className="requestWrapper pt-card" key={instanceObj.id}>
        <InstanceEntry
          itemInstanceObj={instanceObj}
          instanceCustomFields={this.props.instanceCustomFields}
          updateInstance={this.props.updateItemInstance}
          deleteInstance={this.props.deleteItemInstance}
          permission={this.props.permission}
        />
      </div>
    );
  },
  render() {
    const instanceListEmpty = _.isEmpty(this.props.instances);
    return (
      <div className="requestList">
        {!instanceListEmpty && _.map(this.props.instances, this.getInstance)}
      </div>
    );
  },
});

module.exports = InstanceList;
