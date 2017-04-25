const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Alert = require('./../alerts/alert.js');

const RequestBackfillPopover = React.createClass({
  propTypes: {
    onBackfillFileUpload: React.PropTypes.func.isRequired,
    submitBackfillReceipt: React.PropTypes.func.isRequired,
    requests: React.PropTypes.array.isRequired,
  },
  getInitialState() {
    return {
      isConfirmationOpen: false,
      isOpen: false,
      selectedItems: new Set(),
      fileHandle: '',
    };
  },
  async onFileUploadClick() {
    const handle = await this.props.onBackfillFileUpload();
    this.setState({ fileHandle: handle });
  },
  onRetryClick() {
    this.setState({ isConfirmationOpen: false });
    this.onBackfillFileUpload();
  },
  getRequest(requestObj) {
    return (
      <Blueprint.Checkbox
        key={requestObj.id}
        checked={this.state.selectedItems.has(requestObj.id)}
        label={requestObj.itemName}
        onChange={this.toggleItem.bind(null, requestObj.id)}
      />
    );
  },
  getForm() {
    const alertMessage = [<strong key={'PDF Upload'}>{'PDF upload failed. '}</strong>, 'Import failed'];
    const checkboxRequests = _.filter(this.props.requests, { orderType: 'LOAN', orderStatus: 'APPROVED' });
    return (
      <div className="paddedBackfillForm">
        <Alert
          confirmButtonText={'Retry'}
          cancelButtonText={'Cancel'}
          isOpen={this.state.isConfirmationOpen}
          intent={Blueprint.Intent.PRIMARY}
          alertMessage={alertMessage}
          onConfirm={this.onRetryClick}
          onCancel={this.cancelUpload}
        />
        <button className="uploadBackfillPDFButton pt-button" onClick={this.onFileUploadClick}>{'Upload receipt'}</button>
        <label htmlFor={'receipt'} className="formLabel pt-label">
          Receipt for:
        </label>
        {_.map(checkboxRequests, this.getRequest)}
        <button className="submitBackfillButton pt-button pt-intent-primary" onClick={this.submitRequest}>{'Submit'}</button>
      </div>
    );
  },
  async submitRequest() {
    const arr = Array.from(this.state.selectedItems)
    await this.props.submitBackfillReceipt(arr, this.state.fileHandle);
    this.closePopover();
  },
  toggleItem(itemId) {
    const selected = this.state.selectedItems;
    if (this.state.selectedItems.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    this.setState({
      selectedItems: selected,
    });
  },
  openPopover() {
    this.setState({ isOpen: true });
  },
  closePopover() {
    this.setState({
      isOpen: false,
      selectedItems: new Set(),
      fileHandle: '',
    });
  },
  cancelUpload() {
    this.setState({ isConfirmationOpen: false });
  },
  render() {
    return (
      <div className="modifyTagsPopover my-popover pt-popover-dismiss">
        <button
          className="addToCartButton pt-button pt-intent-primary"
          onClick={this.openPopover}
        >
          Request Backfill
        </button>
        <Blueprint.Dialog
          isOpen={this.state.isOpen}
          onClose={this.closePopover}
          title="Request Backfill"
        >
          {this.getForm()}
        </Blueprint.Dialog>
      </div>
    );
  },
});

module.exports = RequestBackfillPopover;
