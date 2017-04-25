const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const CollapsibleInstanceList = require('./../selectors/collapsibleInstanceList.js');
const InstanceSelector = require('./../tagging/instanceSelector.js');
const STATUS = require('./../../enums/status.js');
const TYPE = require('./../../enums/type.js');

const PendingRequestActionPopover = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    processRequest: React.PropTypes.func.isRequired,
    bundleType: React.PropTypes.string.isRequired,
    requests: React.PropTypes.array.isRequired,
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
  getInitialState() {
    return {
      // TODO initialize adminComment properly
      adminComment: '',
      isOpen: false,
      status: STATUS.APPROVED,
      requestType: this.props.bundleType,
      activeTags: [], // array of instanceId
      activeTagsObj: {},
    };
  },
  onDescriptionInputChange(e) {
    this.setState({
      adminComment: e.target.value,
    });
  },
  getItemInstances() {
    return _.map(this.props.instancesObj, (instance) => {
      <div className="pt-select">
        <select onChange={this.onRemarkChange} defaultValue={defaultRemarkValue}>
          <option value={`${STATUS.APPROVED}-${TYPE.DISBURSE}`}>Approve as disbursement</option>
          <option value={`${STATUS.APPROVED}-${TYPE.LOAN}`}>Approve as loan</option>
          <option value={`${STATUS.DENIED}`}>Deny</option>
        </select>
      </div>
    });
  },
  onActiveTagsChange(tags) {
    // don't allow duplicate tags
    // NOTE we use title as instance ids are stored in title
    const activeTagsObj = {};
    _.forEach(tags, (tag) => {
      const itemId = tag.category;
      const instanceId = this.getInstanceIdFromAssetTag(tag.title);

      const activeTags = activeTagsObj[itemId];
      if (!activeTags) {
        activeTagsObj[itemId] = [instanceId];
      } else {
        const newActiveTags = _.concat(activeTags, [instanceId]);
        activeTagsObj[itemId] = _.uniq(newActiveTags);
      }
    });
    const modifiedTags = _.toArray(_.uniqBy(tags, 'title'));

    this.setState({ activeTagsObj, activeTags: modifiedTags });


    // we don't clear error messages here
    // this.setState({ activeTags: modifiedTags });
  },
  onRemarkChange(e) {
    // To simplify the menu we use a single drop-down to select
    // process status and request type. These enums are concatenated
    // in the option value as STATUS-TYPE. The 'deny' option does not
    // have a type.
    const remarkObj = e.target.value.split('-');
    const status = remarkObj[0];
    this.setState({ status });

    const requestType = remarkObj[1];
    if (requestType) {
      this.setState({ requestType });
    }
  },
  getInstanceMap() {
    const instanceMap = {};
    _.forEach(this.props.requests, (request) => {
      const orderId = request.id;
      const tags = this.state.activeTagsObj[request.itemId];
      const currentTagsForOrderId = instanceMap[orderId];
      if (_.isEmpty(currentTagsForOrderId)) {
        instanceMap[orderId] = tags;
      } else {
        instanceMap[orderId] = _.concat(instanceMap[orderId], tags);
      }
    });
    return instanceMap;
  },
  getItemInstanceSelector() {
    // hard code itemIds to given id since you can only dispatch one item at a time
    const itemIds = _.toArray(_.map(this.props.requests, request => request.itemId));
    return (
      <InstanceSelector
        instancesObj={this.props.instancesObj}
        activeTags={this.state.activeTags}
        onActiveTagsChange={this.onActiveTagsChange}
        itemIds={itemIds}
        setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
      />
    );
  },
  getInstanceIdFromAssetTag(assetTag) {
    let instanceId;
    _.forEach(this.props.instancesObj, (instanceObj) => {
      const instances = instanceObj.instances;
      const matchingInstance = _.toArray(_.pickBy(instances, instance => _.isEqual(`${instance.assetTag}`, assetTag)));
      if (!_.isEmpty(matchingInstance[0])) {
        instanceId = matchingInstance[0].instanceId;
      }
    });
    return instanceId;
  },
  getInstanceIdsArray() {
    // convert active tags object to array of instanceIds (for backend dispatch)
    const assetTagToInstanceIdMap = this.getAssetTagToInstanceIdMap();
    // NOTE: We save item instance ID as the tag title.
    const activeTagsByInstanceId = _.map(this.state.activeTags,
      tag => assetTagToInstanceIdMap[tag.title]);
    const instanceIdsArray = _.toArray(activeTagsByInstanceId);
    return instanceIdsArray;
  },
  getAssetTagToInstanceIdMap() {
    const assetTagToInstanceIdMap = {};
    _.forEach(this.props.instancesObj, (instanceObj) => {
      _.forEach(instanceObj.instances, (instance) => {
        assetTagToInstanceIdMap[instance.assetTag] = instance.instanceId;
      });
    });
    return assetTagToInstanceIdMap;
  },
  getConfirmationMenu() {
    const submitButtonText = this.state.status === STATUS.DENIED ? 'Deny' : 'Approve';
    const defaultRemarkValue = `${STATUS.APPROVED}-${this.props.bundleType}`;
    const displayAssetFields = this.containsAsset() && !(this.state.status === STATUS.DENIED);

    return (
      <div className="pt-card">
        <div>
          {displayAssetFields &&
            <div>
              This request contains assets.
              Click on the items below to view available instances and add them by typing the
              asset tag in the box below. You will not be able to process the order
              if the requested quantity exceeds the available number of instances.
              <CollapsibleInstanceList
                instancesObj={this.props.instancesObj}
              />
            </div>
          }
          {displayAssetFields &&
            <label htmlFor={'instance selector'} className="pt-label">
              Enter item instances to fulfill request
              {this.getItemInstanceSelector()}
            </label>
          }
          {(this.state.itemInstanceErrorMessage && displayAssetFields) &&
            <label htmlFor={'itemInstanceError'} className="formError">{this.state.itemInstanceErrorMessage}</label>
          }
          <label htmlFor={'remark'} className="pt-label pt-inline">
            <div className="pt-select">
              <select onChange={this.onRemarkChange} defaultValue={defaultRemarkValue}>
                <option value={`${STATUS.APPROVED}-${TYPE.DISBURSE}`}>Approve as disbursement</option>
                <option value={`${STATUS.APPROVED}-${TYPE.LOAN}`}>Approve as loan</option>
                <option value={`${STATUS.DENIED}`}>Deny</option>
              </select>
            </div>
          </label>
          <div className="dialogFormElement">
            <textarea
              className="pt-input pt-fill"
              placeholder="Admin note"
              dir="auto"
              onChange={this.onDescriptionInputChange}
            />
          </div>
          <div className="buttonGroup">
            <button
              className="confirmRequestButton pt-button pt-intent-primary"
              onClick={this.submitDecision}
            >
              {submitButtonText}
            </button>
            <button className="confirmRequestButton pt-button" onClick={this.closePopover}>{'Cancel'}</button>
          </div>
        </div>
      </div>
    );
  },
  containsAsset() {
    return _.find(this.props.requests, request => (request.isAsset === 1));
  },
  validateActiveTags() {
    if (this.state.status === STATUS.DENIED) {
      return true;
    }

    if (_.isEmpty(this.state.activeTags)) {
      this.setState({ itemInstanceErrorMessage: 'You must select item instances.' });
      return false;
    }
    // create map of itemId to requestedQuantity
    const itemIdToQuantityMap = {};
    _.forEach(this.props.requests, (request) => {
      itemIdToQuantityMap[request.itemId] = request.quantity;
    });

    const incorrectMatches = {};

    _.forEach(this.props.instancesObj, (instanceObj) => {
      const itemId = instanceObj.itemId;
      if (instanceObj.isAsset !== 1) {
        return;
      }
      let count = 0;
      const flatInstanceArray = _.flatMap(instanceObj.instances, instance => `${instance.assetTag}`);
      _.forEach(this.state.activeTags, (tag) => {
        const tagIsActive = _.indexOf(flatInstanceArray, tag.title) !== -1;
        if (tagIsActive) {
          count += 1;
        }
      });
      if (itemIdToQuantityMap[itemId] !== count) {
        incorrectMatches[instanceObj.itemId] = {
          itemId: instanceObj.itemId,
          itemName: instanceObj.itemName,
          expectedQuantity: itemIdToQuantityMap[instanceObj.itemId],
          actualQuantity: count,
        };
      }
    });

    const messages = [];
    if (!_.isEmpty(incorrectMatches)) {
      _.forEach(incorrectMatches, (incorrectMatch) => {
        const message = `${incorrectMatch.itemName} requires ${incorrectMatch.expectedQuantity} instances (selected ${incorrectMatch.actualQuantity})`;
        messages.push(message);
      });
      const errorMessage = `Item instance selection failed validation: ${messages.join(', ')}`;
      this.setState({ itemInstanceErrorMessage: errorMessage });
      return false;
    }
    this.setState({ itemInstanceErrorMessage: '' });
    return true;
  },
  handlePopoverInteraction() {
    const nextState = !this.state.isOpen;
    this.setState({ isOpen: nextState });
  },
  submitDecision() {
    if (this.containsAsset()) {
      if (!this.validateActiveTags()) {
        return;
      }

      // we validate on submit so clear error messages after 3000 ms
      if (!_.isEmpty(this.state.itemInstanceErrorMessage)) {
        setTimeout(() => {
          this.setState({ itemInstanceErrorMessage: '' });
        }, 3000);
      }
    }

    this.setState({ isOpen: false });
    const updateObj = {
      adminComment: this.state.adminComment,
      orderStatus: this.state.status,
      requestType: this.state.requestType,
      instanceMap: this.getInstanceMap(),
    };
    this.props.processRequest(this.props.id, updateObj);
  },
  closePopover() {
    this.setState({ isOpen: false });
  },
  renderAssetPicker() {
    let renderAssetPicker = false;
    _.forEach(this.props.requests, (request) => {
      if (request.isAsset === 1) {
        renderAssetPicker = true;
      }
    });
    return renderAssetPicker;
  },
  render() {
    return (
      <div className="modifyTagsPopover my-popover pt-popover-dismiss">
        <button
          className="addToCartButton pt-button pt-intent-primary"
          onClick={this.handlePopoverInteraction}
        >
          Process
        </button>
        <Blueprint.Dialog
          isOpen={this.state.isOpen}
          onClose={this.handlePopoverInteraction}
          title={`Process ${this.props.name}`}
        >
          {this.getConfirmationMenu()}
        </Blueprint.Dialog>
      </div>
    );
  },
});

module.exports = PendingRequestActionPopover;
