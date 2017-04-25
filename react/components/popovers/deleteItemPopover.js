const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Alert = require('./../alerts/alert.js');

const DeleteItemPopover = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    onDeleteItemClick: React.PropTypes.func.isRequired,
    // feeds this arg into onDeleteItemClick if exists
    deleteArg: React.PropTypes.string,
  },
  getDefaultProps() {
    return {
      deleteArg: null,
    };
  },
  getInitialState() {
    return {
      isConfirmationOpen: false,
    };
  },
  onDeleteConfirmationClick() {
    this.props.onDeleteItemClick(this.props.deleteArg || this.props.id);
    this.setState({ isConfirmationOpen: false });
  },
  handleDeleteClick() {
    this.setState({ isConfirmationOpen: true });
  },
  cancelDelete() {
    this.setState({ isConfirmationOpen: false });
  },
  interceptOnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handleDeleteClick();
  },
  render() {
    const alertMessage = ['Are you sure you want to delete ', <strong key={this.props.name}>{this.props.name}</strong>, '?'];
    return (
      <div className="deleteItemPopover pt-popover-dismiss">
        <Alert
          confirmButtonText={'Delete item'}
          cancelButtonText={'Cancel'}
          isOpen={this.state.isConfirmationOpen}
          intent={Blueprint.Intent.DANGER}
          alertMessage={alertMessage}
          onConfirm={this.onDeleteConfirmationClick}
          onCancel={this.cancelDelete}
        />
        <button
          className="addToCartButton pt-button pt-intent-danger"
          onClick={this.interceptOnClick}
        >
        Delete
        </button>
      </div>
    );
  },
});

module.exports = DeleteItemPopover;
