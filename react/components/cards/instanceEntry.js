const _ = require('lodash');
const React = require('react');
const DeleteItemPopover = require('./../popovers/deleteItemPopover.js');
const ModifyItemInstancePopover = require('./../popovers/modifyItemInstancePopover.js');
const PERMISSIONS = require('./../../enums/permissions.js');
const VISIBILITY = require('./../../enums/visibility.js');
const INSTANCESTATUS = require('./../../enums/instanceStatus.js');

const InstanceEntry = React.createClass({
  propTypes: {
    itemInstanceObj: React.PropTypes.object.isRequired,
    instanceCustomFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string,
      visibility: React.PropTypes.string,
      type: React.PropTypes.string,
    })).isRequired,
    updateInstance: React.PropTypes.func.isRequired,
    deleteInstance: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getStatusTag() {
    let statusClassName = 'statusTag loanTag pt-tag';
    switch (this.props.itemInstanceObj.instanceStatus) {
      case INSTANCESTATUS.AVAILABLE:
        statusClassName += ' pt-intent-success';
        break;
      case INSTANCESTATUS.LOAN:
        statusClassName += ' pt-intent-danger';
        break;
      default:
        break;
    }
    return (<span className={statusClassName}>{this.props.itemInstanceObj.instanceStatus}</span>);
  },
  getFieldsDataFromInstanceObj(instanceObj) {
    // HACK we are hard coding removing keys from instanceObj that
    // are not item fields. This should be replaced with a
    // less hacky way of feeding an object of fields & current
    // values for an item.
    const fieldsObj = {};
    _.forEach(instanceObj, (value, key) => {
      const doNotAdd = (key === 'instanceStatus') ||
        (key === 'id') ||
        (key === 'itemId') ||
        (key === 'assetTag') ||
        (key === 'updatedAt') ||
        (key === 'createdAt');
      if (doNotAdd) {
        return;
      }
      fieldsObj[key] = value;
    });
    // console.log('created fields object', fieldsObj);
    return fieldsObj;
  },
  getFields() {
    const fieldsObj = this.getFieldsDataFromInstanceObj(this.props.itemInstanceObj);
    return _.map(fieldsObj, (value, key) => {
      // TODO add custom fields check
      if (this.props.instanceCustomFields[_.findIndex(this.props.instanceCustomFields, ['name', key])]) {
        if ((this.props.instanceCustomFields[_.findIndex(this.props.instanceCustomFields, ['name', key])].visibility === VISIBILITY.PRIVATE) && (this.props.permission === PERMISSIONS.USER)) {
          return null;
        }
      }
      if (_.isNull(value)) {
        return null;
      }
      return (
        <div className="locationAndModelLabelDetail locationAndModelLabel" key={key}>
          <label htmlFor={'modelLabelDetail'} className="modelLabelDetail pt-running-text-small">
            <b>{`${key} : `}</b>
          </label>
          <label htmlFor={'displayValue'} className="pt-running-text-small">{value}</label>
        </div>
      );
    });
  },
  render() {
    const isManager = (this.props.permission === PERMISSIONS.MANAGER);
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isPriviledgedUser = isManager || isAdmin;
    const fieldsObj = this.getFieldsDataFromInstanceObj(this.props.itemInstanceObj);
    return (
      <div className="request">
        <label htmlFor={'requestLabel'} className="requestLabel pt-ui-text-large">{this.props.itemInstanceObj.assetTag}</label>
        {this.getStatusTag()}
        {isAdmin &&
          <DeleteItemPopover
            id={this.props.itemInstanceObj.assetTag}
            name={`${this.props.itemInstanceObj.assetTag}`}
            onDeleteItemClick={this.props.deleteInstance}
            deleteArg={`${this.props.itemInstanceObj.assetTag}`}
          />
        }
        {isPriviledgedUser &&
          <ModifyItemInstancePopover
            assetTag={this.props.itemInstanceObj.assetTag}
            customFields={this.props.instanceCustomFields}
            fieldsData={fieldsObj}
            onUpdateItemInstance={this.props.updateInstance}
            permission={this.props.permission}
          />
        }
        <div className="requestItemParameters">
          {this.getFields()}
        </div>
      </div>
    );
  },
});

module.exports = InstanceEntry;
