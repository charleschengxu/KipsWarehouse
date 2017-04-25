const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Tags = require('./../components/tagging/tags.js');
const VISIBILITY = require('./../enums/visibility.js');
const FIELDTYPES = require('./../enums/fieldTypes.js');

const NewItemForm = React.createClass({
  propTypes: {
    onCreateOrModifyItem: React.PropTypes.func.isRequired,
    onCreateItemAsAsset: React.PropTypes.func.isRequired,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    defaultExtra: React.PropTypes.object,
    defaultItemName: React.PropTypes.string,
    defaultQuantity: React.PropTypes.string,
    hideQuantity: React.PropTypes.bool,
    onCancelClick: React.PropTypes.func,
  },
  getDefaultProps() {
    return {
      defaultExtra: { tags: [] },
      defaultItemName: '',
      defaultQuantity: '',
      hideQuantity: null,
      onCancelClick: null,
    };
  },
  getInitialState() {
    return {
      itemName: this.props.defaultItemName || '',
      quantity: this.props.defaultQuantity || '',
      extra: this.props.defaultExtra,
      error: {},
      quantityErrorMessage: '',
      nameErrorMessage: '',
      asset: false,
    };
  },
  onNonCustomizedFieldChange(fieldName, fieldType, e) {
    e.stopPropagation();
    // Use this for fields that do not require customization.
    // Customization includes validation or custom logic (e.g. for tags).
    const fieldValue = e.target.value;
    const updatedExtra = this.state.extra || {};
    updatedExtra[fieldName] = fieldValue;
    this.setState({ extra: updatedExtra });
    // validate
    this.validateCustomField(fieldName, fieldType, fieldValue);
  },
  // =========================================================================
  // Custom fields change handlers (e.g. tags, item name, quantity)
  // =========================================================================
  onActiveTagsChange(tags) {
    const modifiedTags = _.map(tags, tag => tag.title);
    const updatedExtra = this.state.extra || {};
    updatedExtra.tags = _.uniq(modifiedTags);
    this.setState({ extra: updatedExtra });
  },
  onItemNameChange(e) {
    e.stopPropagation();
    const name = e.target.value;
    if (!_.isEmpty(name)) {
      this.setState({ itemName: name, nameErrorMessage: '' });
    } else {
      this.setState({ itemName: name, nameErrorMessage: 'You must enter a item name.' });
    }
  },
  onQuantityChange(e) {
    e.stopPropagation();
    const value = e.target.value;
    const isNumber = value.match('^[1-9][0-9]*$');

    if (!isNumber) {
      this.setState({ quantity: value, quantityErrorMessage: 'Invalid quantity.' });
    } else {
      this.setState({ quantity: value, quantityErrorMessage: '' });
    }
  },
  onDescriptionChange(e) {
    e.stopPropagation();
    const updatedDescription = e.target.value;
    const updatedExtra = this.state.extra || {};
    updatedExtra.description = updatedDescription;
    this.setState({ extra: updatedExtra });
  },
  getFormField(fieldName, visibility, fieldType) {
    const shortField = (fieldType !== FIELDTYPES.LONG);
    return (
      <label htmlFor={fieldName} className="formLabel pt-label" key={fieldName}>
        {_.capitalize(fieldName)}
        {(visibility === VISIBILITY.PRIVATE) &&
          <u1 className="fieldPrivacyLabel">{' (private)'}</u1>
        }
        {(shortField) &&
        <input
          className="itemNameInput pt-input"
          key={fieldName}
          onChange={this.onNonCustomizedFieldChange.bind(this, fieldName, fieldType)}
          value={this.state.extra[fieldName] || ''}
          type="text"
          dir="auto"
        />
        }
        {(!shortField) &&
        <textarea
          className="descriptionInput pt-fill pt-input"
          onChange={this.onNonCustomizedFieldChange.bind(this, fieldName, fieldType)}
          value={this.state.extra[fieldName] || ''}
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
    const fields = _.map(this.props.customFields, (customField) => {
      const fieldDiv = this.getFormField(
        customField.name,
        customField.visibility,
        customField.type,
      );
      return fieldDiv;
    });
    return fields;
  },
  async submitFormAsync() {
    // Do not submit if item name or quantity are empty OR if error messages
    // for item name or quantity are *not* empty.
    if (_.isEmpty(this.state.itemName)) {
      this.setState({ nameErrorMessage: 'You must enter a item name.' });
      return;
    }

    if (_.isEmpty(this.state.quantity)) {
      this.setState({ quantityErrorMessage: 'You must enter a quantity.' });
      return;
    }

    if (!_.isEmpty(this.state.quantityErrorMessage) || !_.isEmpty(this.state.nameErrorMessage)) {
      return;
    }

    let resp = '';

    if (this.state.asset) {
      resp = await this.props.onCreateItemAsAsset(
       this.state.itemName,
       this.state.quantity,
       this.state.extra,
     );
    } else {
      resp = await this.props.onCreateOrModifyItem(
        this.state.itemName,
        this.state.quantity,
        this.state.extra,
      );
    }
    if (resp.status !== 'success') {
      // If error message includes 'already exists', surface
      // 'Item already exists' error.
      if (_.includes(resp.error.message, 'already exists')) {
        this.setState({ nameErrorMessage: 'This item already exists. Please try a different name.' });
      }
    } else {
      this.setState(this.getInitialState());
    }
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
          updatedError[fieldName] = '';
        }
        this.setState({ error: updatedError });
        break;
      case FIELDTYPES.INT:
        if (!fieldValue.match(integer)) {
          updatedError[fieldName] = `${fieldName} must be an integer.`;
        } else {
          updatedError[fieldName] = '';
        }
        this.setState({ error: updatedError });
        break;
      default:
        break;
    }
  },
  toggleAsset() {
    this.setState({ asset: !this.state.asset })
  },
  render() {
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Create a new item'}</h3>
        </div>
        <div className="newItemFormInner">
          <label htmlFor={'itemName'} className="formLabel pt-label">
            Item name
            <input
              className="itemNameInput pt-input"
              onChange={this.onItemNameChange}
              value={this.state.itemName}
              type="text"
              placeholder="Required"
              dir="auto"
            />
          </label>
          {this.state.nameErrorMessage &&
            <label htmlFor={'nameErrorMessage'} className="formError">{this.state.nameErrorMessage}</label>
          }
          {!this.props.hideQuantity &&
            <label htmlFor={'quantity'} className="formLabel pt-label">
              Quantity
              <input
                className="quantityInput pt-input"
                onChange={this.onQuantityChange}
                value={this.state.quantity}
                type="text"
                placeholder="Required"
                dir="auto"
              />
            </label>
          }
          {this.state.quantityErrorMessage &&
            <label htmlFor={'quantityErrorMessage'} className="formError">{this.state.quantityErrorMessage}</label>
          }
          {this.getFormField('model', 'Model')}
          <label htmlFor={'description'} className="formLabel pt-label">
            Description
            <textarea
              className="descriptionInput pt-fill pt-input"
              onChange={this.onDescriptionChange}
              value={this.state.extra.description || ''}
              dir="auto"
            />
          </label>
          <label htmlFor={'tags'} className="formLabel pt-label">
            Tags
            <Tags
              activeTags={this.state.extra.tags}
              allTags={this.props.allTags}
              onActiveTagsChange={this.onActiveTagsChange}
              addNew
            />
          </label>
          {this.getCustomFormFields()}
          <Blueprint.Switch className="pt-large" checked={this.state.asset} label="Asset" onChange={this.toggleAsset} />
        </div>
        <div className="createItemContainer">
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.submitFormAsync}>{'Create item'}</button>
          {this.props.onCancelClick &&
            <button className="cancelRequestButton pt-button" onClick={this.props.onCancelClick}>{'Cancel'}</button>
          }
        </div>
      </div>
    );
  },
});

module.exports = NewItemForm;
