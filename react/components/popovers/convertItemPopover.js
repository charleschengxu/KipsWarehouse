const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Alert = require('./../alerts/alert.js');

const ConvertItemPopover = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    onConvertItemClick: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      isConfirmationOpen: false,
    };
  },
  onConvertConfirmationClick() {
    this.props.onConvertItemClick(this.props.id);
    this.setState({ isConfirmationOpen: false });
  },
  handleConvertClick() {
    this.setState({ isConfirmationOpen: true });
  },
  cancelConvert() {
    this.setState({ isConfirmationOpen: false });
  },
  interceptOnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handleConvertClick();
  },
  render() {
    const alertMessage = [
      'Are you sure you want to convert ',
      <strong key={this.props.name}>{this.props.name}</strong>,
      ' to an asset-tracked item? This action cannot be undone.',
    ];
    return (
      <div className="deleteItemPopover pt-popover-dismiss">
        <Alert
          confirmButtonText={'Convert item'}
          cancelButtonText={'Cancel'}
          isOpen={this.state.isConfirmationOpen}
          intent={Blueprint.Intent.PRIMARY}
          alertMessage={alertMessage}
          onConfirm={this.onConvertConfirmationClick}
          onCancel={this.cancelConvert}
        />
        <button
          className="addToCartButton pt-button pt-intent-warning"
          onClick={this.interceptOnClick}
        >
        Convert
        </button>
      </div>
    );
  },
});

module.exports = ConvertItemPopover;
