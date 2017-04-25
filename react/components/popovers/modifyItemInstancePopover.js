const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Alert = require('./../alerts/alert.js');
const FIELDTYPES = require('./../../enums/fieldTypes.js');
const VISIBILITY = require('./../../enums/visibility.js');
const PERMISSIONS = require('./../../enums/permissions.js');

const ModifyItemInstancePopover = React.createClass({
  propTypes: {
    assetTag: React.PropTypes.number.isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    fieldsData: React.PropTypes.object.isRequired,
    onUpdateItemInstance: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getInitialState() {
    // append asset tag to fields data
    const updatedData = this.props.fieldsData;
    updatedData.assetTag = this.props.assetTag;

    return {
      data: updatedData,
      error: {},
      assetTagErrorMessage: '',
      isOpen: false,
      isConfirmationOpen: false,
    };
  },
  onAssetTagChange(e) {
    const assetTag = e.target.value;
    const updatedExtra = this.state.data || {};
    updatedExtra.assetTag = assetTag;

    const integer = '^[1-9][0-9]*$';
    if (!assetTag.match(integer)) {
      this.setState({ assetTagErrorMessage: 'Asset tag must be an integer.' });
    } else if (_.isEmpty(assetTag)) {
      this.setState({ assetTagErrorMessage: 'You must enter an asset tag.' });
    } else {
      this.setState({ assetTagErrorMessage: '' });
    }
    this.setState({ data: updatedExtra });
  },
  onNonCustomizedFieldChange(fieldName, fieldType, e) {
    // Use this for fields that do not require customization.
    // Customization includes validation or custom logic (e.g. for tags).
    const fieldValue = e.target.value;
    const updatedExtra = this.state.data || {};
    updatedExtra[fieldName] = fieldValue;
    this.setState({ data: updatedExtra });
    // validate
    this.validateCustomField(fieldName, fieldType, fieldValue);
  },
  getFormField(fieldName, visibility, fieldType) {
    const shortField = (fieldType !== FIELDTYPES.LONG);
    const isPrivate = (visibility === VISIBILITY.PRIVATE);
    return (
      <label htmlFor={fieldName} className="formLabel pt-label" key={fieldName}>
        {_.capitalize(fieldName)}
        {isPrivate &&
          <u1 className="fieldPrivacyLabel">{' (private)'}</u1>
        }
        {(shortField) &&
          <input
            className="itemNameInput pt-input"
            key={fieldName}
            onChange={this.onNonCustomizedFieldChange.bind(this, fieldName, fieldType)}
            value={this.state.data[fieldName] || ''} type="text" dir="auto"
          />
        }
        {(!shortField) &&
          <textarea
            className="descriptionInput pt-fill pt-input"
            onChange={this.onNonCustomizedFieldChange.bind(this, fieldName, fieldType)}
            value={this.state.data[fieldName] || ''}
            dir="auto"
          />
        }
        {(this.state.error[fieldName]) &&
          <label htmlFor={fieldName} className="formError">{this.state.error[fieldName]}</label>
        }
      </label>
    );
  },
  getCustomFormFields() {
    const fields = _.map(this.props.customFields, customField =>
      this.getFormField(customField.name, customField.visibility, customField.type),
    );
    return fields;
  },
  getForm() {
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    return (
      <div className="modifyItemform">
        <div className="newItemFormInner">
          {isAdmin &&
            <label htmlFor={'assetTag'} className="formLabel pt-label">
              Asset tag
              <input
                className="itemNameInput pt-input"
                onChange={this.onAssetTagChange}
                value={this.state.data.assetTag}
                type="text"
                placeholder="Required"
                dir="auto"
              />
            </label>
          }
          {(isAdmin && this.state.assetTagErrorMessage) &&
            <label htmlFor={'assetTagError'} className="formError">{this.state.assetTagErrorMessage}</label>
          }
          {this.getCustomFormFields()}
        </div>
        <div className="createItemContainer">
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.submitFormAsync}>{'Modify instance'}</button>
          <button className="cancelRequestButton pt-button" onClick={this.handlePopoverInteraction}>{'Cancel'}</button>
        </div>
        <Alert
          confirmButtonText={'Modify instance'}
          cancelButtonText={'Cancel'}
          isOpen={this.state.isConfirmationOpen}
          alertMessage={['Are you sure you want to modify ', <strong key={this.props.assetTag}>{this.props.assetTag}</strong>, '?']}
          onConfirm={this.handleUpdateClick}
          onCancel={this.handlePopoverInteraction}
          intent={Blueprint.Intent.PRIMARY}
        />
      </div>
    );
  },
  handleUpdateClick() {
    this.props.onUpdateItemInstance(this.props.assetTag, this.state.data);
    this.handlePopoverInteraction();
  },
  handlePopoverInteraction() {
    const nextState = !this.state.isOpen;
    // if popover about to open, reset form
    if (nextState === true) {
      const updatedExtra = this.state.data || {};
      updatedExtra.tags = this.state.originalTags;
      this.setState({ data: updatedExtra });
      this.setState(this.getInitialState());
    }
    this.setState({ isOpen: nextState });
  },
  async submitFormAsync() {
    // Do not submit if item name or quantity are empty OR if error messages
    // for item name or quantity are *not* empty.
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    if (isAdmin && _.isNull(this.state.data.assetTag)) {
      this.setState({ assetTagErrorMessage: 'You must enter an asset tag.' });
      return;
    }

    if (!_.isEmpty(this.state.assetTagErrorMessage)) {
      return;
    }

    this.setState({
      isConfirmationOpen: true,
    });
  },
  validateCustomField(fieldName, fieldType, fieldValue) {
    const float = '^([+-]?\\d*\\.?\\d*)$';
    const integer = '^[1-9][0-9]*$';
    const updatedError = this.state.error || {};
    if (_.isEmpty(fieldValue)) {
      updatedError[fieldName] = '';
      return;
    }
    switch (fieldType) {
      case FIELDTYPES.FLOAT:
        if (!fieldValue.match(float)) {
          updatedError[fieldName] = `${fieldName} must be a float.`;
        } else {
          updatedError[fieldName] = null;
        }
        this.setState({ error: updatedError });
        break;
      case FIELDTYPES.INT:
        if (!fieldValue.match(integer)) {
          updatedError[fieldName] = `${fieldName} must be an integer.`;
        } else {
          updatedError[fieldName] = null;
        }
        this.setState({ error: updatedError });
        break;
      default:
        break;
    }
  },
  interceptOnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handlePopoverInteraction();
  },
  render() {
    return (
      <div className="modifyTagsPopover my-popover pt-popover-dismiss">
        <button
          className="addToCartButton pt-button pt-intent-primary"
          onClick={this.interceptOnClick}
        >
        Modify
        </button>
        <Blueprint.Dialog
          isOpen={this.state.isOpen}
          onClose={this.handlePopoverInteraction}
          title="Modify Item Instance"
        >
          {this.getForm()}
        </Blueprint.Dialog>
      </div>
    );
  },
});

module.exports = ModifyItemInstancePopover;
