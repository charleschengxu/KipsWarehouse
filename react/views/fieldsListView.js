const _ = require('lodash');
const React = require('react');
const FieldEntry = require('./../components/cards/fieldEntry.js');

const FieldsListView = React.createClass({
  propTypes: {
    fields: React.PropTypes.array.isRequired,
    instanceFields: React.PropTypes.array.isRequired,
    deleteField: React.PropTypes.func.isRequired,
    deleteInstanceField: React.PropTypes.func.isRequired,
    convertCustomField: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      fields: [],
    };
  },
  getField(field) {
    return (
      <div className="itemWrapper pt-card" key={field.name}>
        <FieldEntry
          fieldObj={field}
          deleteField={this.props.deleteField}
          deleteInstanceField={this.props.deleteInstanceField}
          convertCustomField={this.props.convertCustomField}
          perAsset={false}
        />
      </div>
    );
  },
  getInstanceField(field) {
    return (
      <div className="itemWrapper pt-card" key={field.name}>
        <FieldEntry
          fieldObj={field}
          deleteField={this.props.deleteField}
          deleteInstanceField={this.props.deleteInstanceField}
          convertCustomField={this.props.convertCustomField}
          perAsset={true}
        />
      </div>
    );
  },
  getNoFieldsDialog() {
    return (
      <div className="nonIdealState pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-folder-open" />
        </div>
        <h4 className="pt-non-ideal-state-title">No custom fields created</h4>
      </div>
    );
  },
  render() {
    const combinedFields = this.props.fields.concat(this.props.instanceFields);
    const isEmpty = _.isEmpty(combinedFields);

    return (
      <div className="itemList">
        {isEmpty ?
          this.getNoFieldsDialog() :
          _.map(this.props.fields, this.getField)
        }
        {
          _.map(this.props.instanceFields, this.getInstanceField)
        }
      </div>
    );
  },
});

module.exports = FieldsListView;
