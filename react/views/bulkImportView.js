const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Alert = require('./../components/alerts/alert.js');

const BulkImportView = React.createClass({
  propTypes: {
    showPicker: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      isConfirmationOpen: false,
      errorMessage: '',
    };
  },
  async onFileUploadClick() {
    const resp = await this.props.showPicker();
    if (resp.error) {
      this.setState({
        errorMessage: resp.error.message,
      },
      this.setState({ isConfirmationOpen: true }),
      );
    }
  },
  onRetryClick() {
    this.setState({ isConfirmationOpen: false });
    this.onFileUploadClick();
  },
  getSampleJSON() {
    const sampleJSON = [
      {
        name: '',
        quantity: 1234,
        model: '',
        description: '',
        itemStatus: '',
        isAsset: 1 | 0,
        tags: ['resistor', 'wand'], // array of tag names
        location: 'husdon', // per-item custom field
        restock_info: ' ', // per-item custom field
        /* *_instances_* attribute is permitted only if *_isAsset._*
           Either do not include *_instances_*
           or the instances array must sum up to the item quantity */
        instances:
        [
          {
            assetTag: 1234,
            instanceStatus: 'AVAILABLE' | 'DISBURSE' | 'LOAN',
            instance_location: 'Kips Lab', // instance custom fields integrated
          },
          {
            assetTag: 1234,
            instanceStatus: 'AVAILABLE' | 'DISBURSE' | 'LOAN',
            instance_location: 'Kips Lab', // instance custom fields integrated
          },
        ],
      },
      {
        name: 'test_item2',
        quantity: 2,
        model: 'model 2',
        nosuchfieldreally: 'nuh'
      },
    ];
    return sampleJSON;
  },
  cancelUpload() {
    this.setState({ isConfirmationOpen: false });
  },
  render() {
    const alertMessage = [<strong key={'bulkImport'}>{'Bulk import failed. '}</strong>, this.state.errorMessage];
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Bulk import items from JSON'}</h3>
        </div>
        <div className="createItemContainer">
          {'You can bulk import items from JSON files in the format below.'}
          <pre id="json">
            {JSON.stringify(this.getSampleJSON(), null, 2)}
          </pre>
          <Alert
            confirmButtonText={'Retry'}
            cancelButtonText={'Cancel'}
            isOpen={this.state.isConfirmationOpen}
            intent={Blueprint.Intent.PRIMARY}
            alertMessage={alertMessage}
            onConfirm={this.onRetryClick}
            onCancel={this.cancelUpload}
          />
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.onFileUploadClick}>{'Upload file'}</button>
        </div>
      </div>
    );
  },
});

module.exports = BulkImportView;
