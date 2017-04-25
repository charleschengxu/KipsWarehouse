const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Hotkey = require('react-hotkey');

const Login = React.createClass({
  propTypes: {
    onSignInClick: React.PropTypes.func.isRequired,
    onSignInWithNetIdClick: React.PropTypes.func.isRequired,
    errorMessage: React.PropTypes.string.isRequired,
    loading: React.PropTypes.bool.isRequired,
  },
  mixins: [Hotkey.Mixin('handleHotkey')],
  getInitialState() {
    return {
      username: '',
      password: '',
    };
  },
  onUsernameChange(e) {
    this.setState({ username: e.target.value });
  },
  onPasswordChange(e) {
    this.setState({ password: e.target.value });
  },
  onSignInClick() {
    this.props.onSignInClick(this.state.username, this.state.password).then(
      (status) => {
        if (status !== 'success') {
          setTimeout(() => {
            this.setState({ username: '', password: '' });
          }, 3000);
        }
      },
    );
  },
  handleHotkey(e) {
    if (e.key === 'Enter') {
      this.onSignInClick();
    }
  },
  render() {
    return (
      <div className="loginBox pt-control-group pt-vertical">
        <div className="emailLoginBox pt-input-group pt-large">
          <span className="pt-icon pt-icon-user" />
          <input
            className="pt-input"
            type="text"
            placeholder="Username"
            dir="auto"
            value={this.state.username}
            onChange={this.onUsernameChange}
          />
        </div>
        <div className="passwordLoginBox pt-input-group pt-large">
          <span className="pt-icon pt-icon-lock" />
          <input
            className="pt-input"
            type="password"
            placeholder="Password"
            dir="auto"
            value={this.state.password}
            onChange={this.onPasswordChange}
          />
        </div>
        {this.props.errorMessage &&
          <label htmlFor={'loginError'} className="formError pt-ui-text">{this.props.errorMessage}</label>
        }
        <Blueprint.Button
          className="signInButton pt-large pt-button pt-intent-primary"
          onClick={this.onSignInClick}
          loading={this.props.loading}
        >
        Login
        </Blueprint.Button>
        <div>
          <Blueprint.Button
            className="oathLogin pt-minimal pt-intent-disabled"
            onClick={this.props.onSignInWithNetIdClick}
          >
          Login with NetID
          </Blueprint.Button>
        </div>
      </div>
    );
  },
});

module.exports = Login;
