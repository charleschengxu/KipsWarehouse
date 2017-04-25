const React = require('react');
const DeleteItemPopover = require('./../popovers/deleteItemPopover.js');
const VISIBILITY = require('./../../enums/visibility.js');

const FieldEntry = React.createClass({
  propTypes: {
    fieldObj: React.PropTypes.object.isRequired,
    deleteField: React.PropTypes.func.isRequired,
    deleteInstanceField: React.PropTypes.func.isRequired,
    perAsset: React.PropTypes.bool.isRequired,
    convertCustomField: React.PropTypes.func.isRequired,
  },
  onConvertClick() {
    this.props.convertCustomField(this.props.fieldObj.name);
  },
  getDeleteItemPopover() {
    if (this.props.perAsset) {
      return (
        <DeleteItemPopover
          id={this.props.fieldObj.id}
          name={this.props.fieldObj.name}
          onDeleteItemClick={this.props.deleteInstanceField}
          deleteArg={this.props.fieldObj.name}
        />
      );
    }
    return (
      <DeleteItemPopover
        id={this.props.fieldObj.id}
        name={this.props.fieldObj.name}
        onDeleteItemClick={this.props.deleteField}
        deleteArg={this.props.fieldObj.name}
      />
    );
  },
  render() {
    const isPrivateField = (this.props.fieldObj.visibility === VISIBILITY.PRIVATE);
    return (
      <div>
        {this.getDeleteItemPopover()}
        {!this.props.perAsset &&
        <button className="addToCartButton pt-button pt-intent-warning" onClick={this.onConvertClick}> Convert </button>
        }
        <div className="item">
          <label
            htmlFor={this.props.fieldObj.name}
            className="itemLabel pt-ui-text-large"
          >
            {this.props.fieldObj.name}
          </label>
          {isPrivateField &&
            <u1 className="fieldPrivacyLabel">{' (private)'}</u1>
          }
          <div className="locationAndModelLabel">
            <label htmlFor={'fieldTypeLabel'} className="modelLabel pt-running-text-small">{'Field type: '}</label>
            <label
              htmlFor={this.props.fieldObj.type}
              className="modelLabel pt-running-text-small"
            >
              {this.props.fieldObj.type}
            </label>
            {this.props.perAsset &&
              <div><i><label htmlFor={'perAsset'} className="modelLabel pt-running-text-small">{'Per Asset Field '}</label></i></div>
            }
          </div>
        </div>
      </div>
    );
  },
});

module.exports = FieldEntry;
