const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');

const CollapsibleInstanceList = React.createClass({
  propTypes: {
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
  },
  getInitialState() {
    const isOpenMap = {};
    _.forEach(this.props.instancesObj, (instance) => {
      isOpenMap[instance.itemId] = false;
    });
    return {
      isOpenMap,
    };
  },
  getCollapsibleElement(instancesObj) {
    const itemId = instancesObj.itemId;
    const itemName = instancesObj.itemName;
    const instances = instancesObj.instances;
    const instancesJSX = _.map(instances, instance =>
      <div>
        <label htmlFor={instance.assetTag} key={instance.assetTag} className="orderNumberLabel collapseLabel pt-running-text-small">{`${instance.assetTag}`}</label>
      </div>,
    );
    const boundClick = this.handleClick.bind(null, itemId);
    return (
      <div className="collapsible formLabel pt-label" key={itemId}>
        <Blueprint.Button className="pt-minimal" onClick={boundClick} iconName={this.state.isOpenMap[itemId] ? 'chevron-down' : 'chevron-right'}>
          {`${itemName} instances`}
        </Blueprint.Button>
        <Blueprint.Collapse isOpen={this.state.isOpenMap[itemId]}>
          {_.isEmpty(instances) ? 'No instances available.' : instancesJSX}
        </Blueprint.Collapse>
      </div>
    );
  },
  handleClick(itemId) {
    const isOpenMap = this.state.isOpenMap;
    isOpenMap[itemId] = !isOpenMap[itemId];
    this.setState({ isOpenMap });
  },
  render() {
    return (
      <div className="instancesBox">
        {_.map(this.props.instancesObj, this.getCollapsibleElement)}
      </div>
    );
  },
});

module.exports = CollapsibleInstanceList;
