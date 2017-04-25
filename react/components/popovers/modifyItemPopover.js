const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Tags = require('./../tagging/tags.js');
const Alert = require('./../alerts/alert.js');
const FIELDTYPES = require('./../../enums/fieldTypes.js');
const VISIBILITY = require('./../../enums/visibility.js');

const ModifyItemPopover = React.createClass({
  propTypes: {
    id: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    quantity: React.PropTypes.number.isRequired,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    fieldsData: React.PropTypes.object.isRequired,
    onUpdateItem: React.PropTypes.func.isRequired,
    isManager: React.PropTypes.bool.isRequired,
    isAsset: React.PropTypes.number.isRequired,
  },
  getInitialState() {
    return {
      data: this.props.fieldsData || { tags: [] },
      error: {},
      originalTags: this.props.fieldsData.tags || [],
      quantityErrorMessage: '',
      nameErrorMessage: '',
      isOpen: false,
      isConfirmationOpen: false,
      quantityOperator: 'add',
    };
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
  onActiveTagsChange(tags) {
    const modifiedTags = _.map(tags, tag => tag.title);
    const updatedExtra = this.state.data || {};
    updatedExtra.tags = _.uniq(modifiedTags);
    this.setState({ data: updatedExtra });
  },
  onItemNameChange(e) {
    const name = e.target.value;
    const updatedExtra = this.state.data || {};
    updatedExtra.name = name;
    if (!_.isEmpty(name)) {
      this.setState({ nameErrorMessage: '' });
    } else {
      this.setState({ nameErrorMessage: 'You must enter a item name.' });
    }
    this.setState({ data: updatedExtra });
  },
  onSelectChange(e) {
    this.setState({ quantityOperator: e.target.value });
  },
  onQuantityChange(e) {
    if (this.props.isManager) {
      const value = e.target.value;
      const isNumber = (value.match('^[1-9][0-9]*$') || (value === ''));
      const updatedExtra = this.state.data || {};
      if (this.state.quantityOperator === 'add') {
        updatedExtra.quantity = Number(this.props.quantity) + Number(value);
      } else if (this.state.quantityOperator === 'remove') {
        updatedExtra.quantity = Number(this.props.quantity) - Number(value);
      }
      let quantityErrorMessage;
      if (_.isNull(updatedExtra.quantity) || (updatedExtra.quantity === '')) {
        this.setState({ quantityErrorMessage: '' });
        return;
      }
      if (!isNumber || (updatedExtra.quantity < 0)) {
        quantityErrorMessage = 'Invalid quantity.';
      } else {
        quantityErrorMessage = '';
      }
      this.setState({ data: updatedExtra, quantityErrorMessage });
    } else {
      const value = e.target.value;
      const isNumber = value.match('^[1-9][0-9]*$');
      const updatedExtra = this.state.data || {};
      updatedExtra.quantity = value;
      let quantityErrorMessage;
      if (!isNumber) {
        quantityErrorMessage = 'Invalid quantity.';
      } else {
        quantityErrorMessage = '';
      }
      this.setState({ data: updatedExtra, quantityErrorMessage });
    }
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
    const asset = this.props.isAsset === 1;
    return (
      <div className="modifyItemform">
        <div className="newItemFormInner">
          <label htmlFor={'itemName'} className="formLabel pt-label">
            Item name
            <input
              className="itemNameInput pt-input"
              onChange={this.onItemNameChange}
              value={this.state.data.name}
              type="text"
              placeholder="Required"
              dir="auto"
            />
          </label>
          {this.state.nameErrorMessage &&
            <label htmlFor={'nameError'} className="formError">{this.state.nameErrorMessage}</label>
          }
          {!this.props.isManager && !asset &&
            <label htmlFor={'quantity'} className="formLabel pt-label">
              Quantity
              <input
                className="quantityInput pt-input"
                onChange={this.onQuantityChange}
                value={this.state.data.quantity}
                type="text"
                placeholder="Required"
                dir="auto"
              />
            </label>
          }
          {this.props.isManager && !asset &&
            <label htmlFor={'quantityToggle'} className="formLabel pt-label">
              <div>Quantity</div>
              <select onChange={this.onSelectChange}>
                <option key={'add'} value={'add'}>add</option>
                <option key={'remove'} value={'remove'}>remove</option>
              </select>
              <input
                className="quantityInput pt-input"
                onChange={this.onQuantityChange}
                type="text"
                dir="auto"
              />
            </label>
          }
          {this.state.quantityErrorMessage &&
            <label htmlFor={'quantityErrorMessage'} className="formError">{this.state.quantityErrorMessage}</label>
          }
          {this.getFormField('model', 'Model', FIELDTYPES.SHORT)}
          {this.getFormField('description', 'Description', FIELDTYPES.LONG)}
          <label htmlFor={'tags'} className="formLabel pt-label">
            Tags
            <Tags
              activeTags={this.state.data.tags}
              allTags={this.props.allTags}
              onActiveTagsChange={this.onActiveTagsChange}
              addNew
            />
          </label>
          {this.getCustomFormFields()}
        </div>
        <div className="createItemContainer">
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.submitFormAsync}>{'Modify item'}</button>
          <button className="cancelRequestButton pt-button" onClick={this.handlePopoverInteraction}>{'Cancel'}</button>
        </div>
        <Alert
          confirmButtonText={'Modify item'}
          cancelButtonText={'Cancel'}
          isOpen={this.state.isConfirmationOpen}
          alertMessage={['Are you sure you want to modify ', <strong key={this.props.name}>{this.props.name}</strong>, '?']}
          onConfirm={this.handleUpdateClick}
          onCancel={this.handlePopoverInteraction}
          intent={Blueprint.Intent.PRIMARY}
        />
      </div>
    );
  },
  handleUpdateClick() {
    this.props.onUpdateItem(this.props.id, this.state.data);
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
    if (_.isEmpty(this.state.data.name)) {
      this.setState({ nameErrorMessage: 'You must enter a item name.' });
      return;
    }

    if (!_.isEmpty(this.state.quantityErrorMessage) || !_.isEmpty(this.state.nameErrorMessage)) {
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
          title="Modify Item"
        >
          {this.getForm()}
        </Blueprint.Dialog>
      </div>
    );
  },
});

module.exports = ModifyItemPopover;
