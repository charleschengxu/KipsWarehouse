const _ = require('lodash');
const React = require('react');
const TagInput = require('react-categorized-tag-input');

const InstanceSelector = React.createClass({
  propTypes: {
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
    activeTags: React.PropTypes.arrayOf(React.PropTypes.shape({
      instanceId: React.PropTypes.string,
      assetTag: React.PropTypes.string,
    })),
    onActiveTagsChange: React.PropTypes.func.isRequired,
    itemIds: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    setItemInstancesObjByItemIds: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      activeTags: [],
    };
  },
  getInitialState() {
    const instanceIdToItemIdMap = this.getInstanceIdToItemIdMap();
    return {
      instanceIdToItemIdMap,
    };
  },
  componentWillMount() {
    this.props.setItemInstancesObjByItemIds(this.props.itemIds);
  },
  onTagsChange(tags) {
    this.props.onActiveTagsChange(tags);
  },
  getInstanceIdToItemIdMap() {
    // Gets map of instanceId --> itemId
    const instanceIdToItemIdMap = {};
    _.forEach(this.props.instancesObj, (instanceObj) => {
      instanceIdToItemIdMap[instanceObj.instanceId] = instanceObj.itemId;
    });
    return instanceIdToItemIdMap;
  },
  getCategories() {
    const categories = _.map(this.props.instancesObj, instanceObj => ({
      id: instanceObj.itemId,
      type: 'tag',
      title: instanceObj.itemName,
      items: _.toArray(_.map(instanceObj.instances, instance => `${instance.assetTag}`)),
    }));
    return categories;
  },
  getCategoryForInstance(tag) {
    // given tag object, return itemId
    const category = this.state.instanceIdToItemIdMap[tag.instanceId];
    return category;
  },
  render() {
    const categories = this.getCategories();
    return (
      <div className="tagBox">
        <TagInput
          categories={categories}
          addNew={false}
          onChange={this.onTagsChange}
          value={this.props.activeTags || []}
          transformTag={this.transformTag}
        />
      </div>
    );
  },
});

module.exports = InstanceSelector;
