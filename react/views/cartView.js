const _ = require('lodash');
const React = require('react');
const TYPE = require('./../enums/type.js');
const Hotkey = require('react-hotkey');

const CartView = React.createClass({
  propTypes: {
    onRemoveFromCart: React.PropTypes.func.isRequired,
    onSubmitCart: React.PropTypes.func.isRequired,
    cart: React.PropTypes.array.isRequired,
  },
  mixins: [Hotkey.Mixin('handleHotkey')],
  getInitialState() {
    return {
      userComment: '',
      userCommentErrorMessage: '',
      quantity: '',
      requestType: TYPE.DISBURSE,
    };
  },
  onUserCommentChange(e) {
    e.preventDefault();
    this.setState({ userComment: e.target.value });
    if (!_.isEmpty(e.target.value)) {
      this.setState({ userCommentErrorMessage: '' });
    }
  },
  onSelectChange(e) {
    this.setState({ requestType: e.target.value });
  },
  onSubmitCart() {
    // Validate user comment
    if (!_.isEmpty(this.state.userCommentErrorMessage)) {
      return;
    }
    // props.onSubmitCart.bind(null, this.state.userComment)
    if (_.isEmpty(this.state.userComment)) {
      this.setState({ userCommentErrorMessage: 'You must enter a reason for your request.' });
    } else {
      this.setState({ userCommentErrorMessage: '' });
      this.props.onSubmitCart(this.state.userComment, this.state.requestType);
    }
  },
  getCartItem(orderObj) {
    const itemName = orderObj.itemName;
    const orderId = orderObj.id;
    const quantity = orderObj.quantity;
    return (
      <div className="itemWrapper pt-card" key={orderId}>
        <label htmlFor={itemName} className="itemLabel pt-ui-text-large">{itemName}</label>
        <button
          className="addToCartButton pt-button pt-intent-danger"
          onClick={this.props.onRemoveFromCart.bind(null, orderId, itemName)}
        >
          Remove
        </button>
        <div className="quantityLabel">
          {'Quantity: '}
          <label htmlFor={'quantity'} className="pt-running-text-small">
            {quantity}
          </label>
        </div>
      </div>
    );
  },
  handleHotkey(e) {
    if (e.key === 'Enter') {
      if (_.isEmpty(this.state.userComment)) {
        this.setState({ userCommentErrorMessage: 'You must enter a reason for your request.' });
      }
      _.debounce(() => this.onSubmitCart(), 300);
    }
  },
  render() {
    const isEmpty = _.isEmpty(this.props.cart);
    const title = isEmpty ? 'Your cart is empty' : 'Your cart';
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{title}</h3>
        </div>
        <div className="newItemFormInner">
          {!isEmpty &&
            _.map(this.props.cart, cartObj => this.getCartItem(cartObj))
          }
          {!isEmpty &&
            <div>
              <label htmlFor={'description'} className="formLabel pt-label">
                Description
                <textarea
                  className="descriptionInput pt-fill pt-input"
                  onChange={this.onUserCommentChange}
                  value={this.state.userComment}
                  dir="auto"
                />
              </label>
              {this.state.userCommentErrorMessage &&
                <label htmlFor={'userCommentErrorMessage'} className="formError">{this.state.userCommentErrorMessage}</label>
              }
              <label htmlFor={'requestType'} className="formLabel pt-label">
                Request type
                <div className="permissionDropdown pt-select">
                  <select className="pt-inline" onChange={this.onSelectChange}>
                    <option value={TYPE.DISBURSE}>Disbursement</option>
                    <option value={TYPE.LOAN}>Loan</option>
                  </select>
                </div>
              </label>
            </div>
          }
          {isEmpty &&
            <label htmlFor={'emptyCartMessage'} className="emptyCartMessage pt-running-text-small">
            Please request an item from the item view.
            </label>
          }
        </div>
        {!isEmpty &&
          <div className="createItemContainer">
            <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.onSubmitCart}>{'Submit order'}</button>
          </div>
        }
      </div>
    );
  },
});

module.exports = CartView;
