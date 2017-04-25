const _ = require('lodash');
const React = require('react');
const VISIBILITY = require('./../enums/visibility.js');
const FIELDTYPES = require('./../enums/fieldTypes.js');
const Hotkey = require('react-hotkey');

const NewFieldView = React.createClass({
  propTypes: {
    onCreateField: React.PropTypes.func.isRequired,
  },
  mixins: [Hotkey.Mixin('handleHotkey')],
  getInitialState() {
    return {
      name: '',
      visibility: VISIBILITY.PUBLIC,
      fieldType: FIELDTYPES.SHORT,
    };
  },
  onNameChange(e) {
    const name = e.target.value;
    this.setState({ name });
    if (!_.isEmpty(this.state.name)) {
      this.setState({ nameErrorMessage: '' });
    }
  },
  onFieldTypeChange(e) {
    this.setState({ fieldType: e.target.value });
  },
  onVisibilityChange(e) {
    this.setState({ visibility: e.target.value });
  },
  validateForm() {
    let enableSubmit = true;
    if (_.isEmpty(this.state.name)) {
      this.setState({ nameErrorMessage: 'You must enter a name.' });
      enableSubmit = false;
    } else {
      this.setState({ nameErrorMessage: '' });
    }
    return enableSubmit;
  },
  async submitFormAsync() {
    const enableSubmit = this.validateForm();
    if (!enableSubmit) {
      return;
    }
    // TODO surface error
    await this.props.onCreateField(
      this.state.name,
      this.state.fieldType,
      this.state.visibility,
    );

    // TODO change to not reset if not successful?
    this.setState(this.getInitialState());
  },
  handleHotkey(e) {
    if (e.key === 'Enter') {
      this.submitFormAsync();
    }
  },
  render() {
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Create a new field'}</h3>
        </div>
        <div className="newItemFormInner">
          <label htmlFor={'fieldName'} className="formLabel pt-label">
            Field name
            <input
              className="fullNameInput pt-input"
              onChange={this.onNameChange}
              value={this.state.name || ''}
              type="text"
              placeholder="Required"
              dir="auto"
            />
          </label>
          {this.state.nameErrorMessage &&
            <label htmlFor={'formError'} className="formError">{this.state.nameErrorMessage}</label>
          }
          <label htmlFor={'fieldType'} className="formLabel pt-label">
            Field type
            <div className="permissionDropdown pt-select">
              <select className="pt-inline" onChange={this.onFieldTypeChange}>
                <option value={FIELDTYPES.SHORT}>Short text</option>
                <option value={FIELDTYPES.LONG}>Long text</option>
                <option value={FIELDTYPES.INT}>Integer</option>
                <option value={FIELDTYPES.FLOAT}>Float</option>
              </select>
            </div>
          </label>
          <label htmlFor={'visbility'} className="formLabel pt-label">
            Visibility
            <div className="permissionDropdown pt-select">
              <select className="pt-inline" onChange={this.onVisibilityChange}>
                <option value={VISIBILITY.PUBLIC}>Public</option>
                <option value={VISIBILITY.PRIVATE}>Private</option>
              </select>
            </div>
          </label>
          {'If you\'d like to create an asset-level field, please create an item level field and then convert from the manage fields menu.'}
        </div>
        <div className="createItemContainer">
          <button
            className="confirmRequestButton pt-button pt-intent-primary"
            onClick={this.submitFormAsync}
          >
            {'Create field'}
          </button>
        </div>
      </div>
    );
  },
});

module.exports = NewFieldView;
