const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const InstanceSelector = require('./../tagging/instanceSelector.js');
const CollapsibleInstanceList = require('./../selectors/collapsibleInstanceList.js');
const TYPE = require('./../../enums/type.js');

const DispatchPopover = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    quantity: React.PropTypes.number,
    maxQuantity: React.PropTypes.number.isRequired,
    users: React.PropTypes.array.isRequired,
    enabled: React.PropTypes.bool.isRequired,
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
  getDefaultProps() {
    return {
      quantity: null,
    };
  },
  getInitialState() {
    const assignedUser = this.props.users[0] ? this.props.users[0].id : '';
    return {
      adminComment: '',
      isOpen: false,
      // default to first user
      assignedUser,
      quantity: this.props.quantity || '1',
      activeTags: [],
    };
  },
  onActiveTagsChange(tags) {
    // don't allow duplicate tags
    // NOTE we use title as instance ids are stored in title
    const modifiedTags = _.toArray(_.uniqBy(tags, 'title'));

    // clear error message if tags isn't empty
    if (!_.isEmpty(modifiedTags)) {
      this.setState({ itemInstanceErrorMessage: '' });
    }

    this.setState({ activeTags: modifiedTags });
  },
  // form fields
  onDescriptionInputChange(e) {
    this.setState({
      adminComment: e.target.value,
    });
  },
  onUserSelectChange(e) {
    // We use the value to store the user's id.
    this.setState({ assignedUser: e.target.value });
  },
  onQuantityChange(e) {
    const value = e.target.value;
    const isNumber = value.match('^[1-9][0-9]*$');

    if (!isNumber) {
      this.setState({ quantityErrorMessage: 'Invalid quantity.' });
    } else if (parseInt(value, 10) > this.props.maxQuantity) {
      this.setState({ quantityErrorMessage: 'Quantity exceeds available pool.' });
    } else {
      this.setState({ quantityErrorMessage: '', quantity: value });
    }
  },
  getItemInstanceSelector() {
    // hard code itemIds to given id since you can only dispatch one item at a time
    const itemIds = [this.props.id];
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
      const matchingInstance = _.pickBy(instances, instance => instance.assetTag === assetTag);
      if (matchingInstance) {
        instanceId = matchingInstance.instanceId;
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
  getPossibleAssignees() {
    // We use the value to store the user's id.
    return _.map(this.props.users, user =>
      (<option key={user.id} value={user.id}>{user.displayName}</option>));
  },
  getAssignToDropdown() {
    return (
      <label htmlFor={'assignTo'} className="pt-label pt-inline">
        Assign to
        <div className="pt-select">
          <select onChange={this.onUserSelectChange}>
            {this.getPossibleAssignees()}
          </select>
        </div>
      </label>
    );
  },
  getConfirmationMenu() {
    const boundLoanClick = this.dispatchItem.bind(null, TYPE.LOAN);
    const boundDisburseClick = this.dispatchItem.bind(null, TYPE.DISBURSE);
    const displayAssetFields = (this.props.isAsset === 1);

    return (
      <div className="itemConfirmation pt-card">
        <label
          htmlFor={this.props.name}
          className="itemLabelConfirmation pt-ui-text-large"
        >
          {this.props.name}
        </label>
        {!displayAssetFields &&
          <label htmlFor={'quantity'} className="formLabel pt-label">
            Quantity
            <input
              className="quantityInput pt-input"
              style={{ width: '250px' }}
              onChange={this.onQuantityChange}
              type="text"
              dir="auto"
              defaultValue={this.state.quantity}
            />
          </label>
        }
        {(this.state.quantityErrorMessage && !displayAssetFields) &&
          <label htmlFor={'quantityError'} className="formError">{this.state.quantityErrorMessage}</label>
        }
        {displayAssetFields &&
          <CollapsibleInstanceList
            instancesObj={this.props.instancesObj}
          />
        }
        {displayAssetFields &&
          <label htmlFor={'instance selector'} className="formLabel pt-label">
            Enter item instances to dispatch
            {this.getItemInstanceSelector()}
          </label>
        }
        {(this.state.itemInstanceErrorMessage && displayAssetFields) &&
          <label htmlFor={'itemInstanceError'} className="formError">{this.state.itemInstanceErrorMessage}</label>
        }
        {this.getAssignToDropdown()}
        <div className="descriptionWrapper">
          <textarea
            className="descriptionInput pt-input pt-fill"
            placeholder="Admin note"
            dir="auto"
            onChange={this.onDescriptionInputChange}
          />
        </div>
        <button
          className="confirmRequestButton pt-button pt-intent-primary"
          onClick={boundDisburseClick}
        >
          Disburse
        </button>
        <button
          className="confirmRequestButton pt-button pt-intent-primary"
          onClick={boundLoanClick}
        >
          Loan
        </button>
        <button className="cancelRequestButton pt-button" onClick={this.closePopover}>{'Cancel'}</button>
      </div>
    );
  },
  handlePopoverInteraction() {
    const quantityGreaterThanZero = (this.props.maxQuantity > 0);
    // close if popover is open. otherwise open if quantity > 0
    const nextState = this.state.isOpen ? false : quantityGreaterThanZero;
    this.setState({ isOpen: nextState });
  },
  closePopover() {
    this.setState({ isOpen: false });
  },
  dispatchItem(type) {
    const passesVerification = this.allowFormSubmit();
    if (!passesVerification) {
      return;
    }
    this.setState({ isOpen: false });
    const instanceIdsArray = (this.props.isAsset === 1) ? this.getInstanceIdsArray() : [];
    const quantity = (this.props.isAsset === 1) ? instanceIdsArray.length : this.state.quantity;
    if (type === TYPE.LOAN) {
      this.props.dispatchAsLoan(
        this.state.assignedUser,
        this.props.id,
        quantity,
        this.state.adminComment,
        instanceIdsArray,
      );
    } else {
      this.props.dispatchItem(
        this.props.id,
        quantity,
        this.state.adminComment,
        instanceIdsArray,
        this.state.assignedUser,
      );
    }
    this.setState(this.getInitialState());
  },
  allowFormSubmit() {
    if (this.props.isAsset === 1) {
      if (_.isEmpty(this.state.activeTags)) {
        this.setState({ itemInstanceErrorMessage: 'You must select at least one instance.' });
        return false;
      }

      if (!_.isEmpty(this.state.itemInstanceErrorMessage)) {
        return false;
      }
    } else {
      if (_.isEmpty(this.state.quantity)) {
        this.setState({ quantityErrorMessage: 'You must enter a quantity.' });
        return false;
      }

      if (!_.isEmpty(this.state.quantityErrorMessage)) {
        return false;
      }
    }
    return true;
  },
  interceptOnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handlePopoverInteraction();
  },
  render() {
    return (
      <div className="submitRequestPopover pt-popover-dismiss">
        <Blueprint.Popover
          content={this.getConfirmationMenu()}
          position={Blueprint.Position.LEFT_TOP}
          isOpen={this.state.isOpen}
          onInteraction={state => this.handlePopoverInteraction(state)}
        >
          <button
            className="addToCartButton pt-button"
            disabled={!this.props.enabled}
            onClick={this.interceptOnClick}
          >
          Dispatch
          </button>
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = DispatchPopover;
