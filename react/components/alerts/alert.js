const React = require('react');
const Blueprint = require('@blueprintjs/core');

const Alert = React.createClass({
  propTypes: {
    confirmButtonText: React.PropTypes.string.isRequired,
    cancelButtonText: React.PropTypes.string.isRequired,
    alertMessage: React.PropTypes.array.isRequired,
    onConfirm: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired,
    isOpen: React.PropTypes.bool.isRequired,
    intent: React.PropTypes.number.isRequired,
  },
  render() {
    return (
      <div className="alert">
        <Blueprint.Alert
          className={'alert'}
          intent={this.props.intent}
          isOpen={this.props.isOpen}
          confirmButtonText={this.props.confirmButtonText}
          cancelButtonText={this.props.cancelButtonText}
          onConfirm={this.props.onConfirm}
          onCancel={this.props.onCancel}
        >
          <p>
            {this.props.alertMessage}
          </p>
        </Blueprint.Alert>
      </div>
    );
  },
});

module.exports = Alert;
