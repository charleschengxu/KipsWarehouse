const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');

const SubmitRequestPopover = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    quantity: React.PropTypes.number.isRequired,
    submitOrder: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      isOpen: false,
      quantity: '',
    };
  },
  onQuantityChange(e) {
    this.setState({ quantity: e.target.value });
  },
  getConfirmationMenu() {
    return (
      <div className="itemConfirmation pt-card">
        <label
          htmlFor={this.props.name}
          className="itemLabelConfirmation pt-ui-text-large"
        >
          {this.props.name}
        </label>
        <label htmlFor={'quantity'} className="formLabel pt-label">
          Quantity
          <input
            className="quantityInput pt-input"
            style={{ width: '250px' }}
            onChange={this.onQuantityChange}
            value={this.state.quantity || ''}
            placeholder={'Required'}
          />
        </label>
        {this.state.quantityErrorMessage &&
          <label htmlFor={'quantityErrorMessage'} className="formError">{this.state.quantityErrorMessage}</label>
        }
        <button
          className="confirmRequestButton pt-button pt-intent-primary"
          onClick={this.submitOrder}
        >
        Add to cart
        </button>
        <button className="cancelRequestButton pt-button" onClick={this.closePopover}>{'Cancel'}</button>
      </div>
    );
  },
  submitOrder() {
    const isNumber = this.state.quantity.search('^[1-9][0-9]*$');
    if (isNumber === -1) {
      this.setState({ quantityErrorMessage: 'You must enter a number.' });
      return;
    }
    this.setState({ quantityErrorMessage: '' });

    if (_.isEmpty(this.state.quantity)) {
      this.setState({ quantityErrorMessage: 'You must enter a quantity.' });
      return;
    }

    if (!_.isEmpty(this.state.quantityErrorMessage)) {
      return;
    }

    this.props.submitOrder(this.props.id, this.state.quantity);
    this.setState({ isOpen: false });
  },
  interceptOnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handlePopoverInteraction();
  },
  closePopover() {
    this.setState({ isOpen: false, quantity: '' });
  },
  handlePopoverInteraction() {
    const quantityGreaterThanZero = (this.props.quantity > 0);
    // close if popover is open. otherwise open if quantity > 0
    const nextState = this.state.isOpen ? false : quantityGreaterThanZero;
    this.setState({ isOpen: nextState });
  },
  render() {
    return (
      <div className="submitRequestPopover pt-popover-dismiss">
        <Blueprint.Popover
          content={this.getConfirmationMenu()}
          position={Blueprint.Position.LEFT_TOP}
          isOpen={this.state.isOpen}
          onInteraction={state => this.handlePopoverInteraction(state)}
        >
          <button
            className="addToCartButton pt-intent-primary pt-button"
            onClick={this.interceptOnClick}
          >
          Add to cart
          </button>
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = SubmitRequestPopover;
