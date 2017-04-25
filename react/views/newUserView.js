const _ = require('lodash');
const React = require('react');
const PERMISSIONS = require('./../enums/permissions.js');
const Hotkey = require('react-hotkey');

const NewUserView = React.createClass({
  propTypes: {
    onCreateUser: React.PropTypes.func.isRequired,
  },
  mixins: [Hotkey.Mixin('handleHotkey')],
  getInitialState() {
    return {
      emailErrorMessage: '',
      nameErrorMessage: '',
      usernameErrorMessage: '',
      passwordErrorMessage: '',
      email: '',
      password: '',
      username: '',
      name: '',
      permission: PERMISSIONS.USER,
    };
  },
  onNameChange(e) {
    const name = e.target.value;
    this.setState({ name });
    if (!_.isEmpty(this.state.name)) {
      this.setState({ nameErrorMessage: '' });
    }
  },
  onUsernameChange(e) {
    const username = e.target.value;
    this.setState({ username });
    if (!_.isEmpty(this.state.username)) {
      this.setState({ usernameErrorMessage: '' });
    }
  },
  onPasswordChange(e) {
    const password = e.target.value;
    this.setState({ password });
    if (!_.isEmpty(this.state.password)) {
      this.setState({ passwordErrorMessage: '' });
    }
  },
  onEmailChange(e) {
    const value = e.target.value;
    this.setState({ email: value });
    if (this.isEmailValid()) {
      this.setState({ emailErrorMessage: '' });
    }
  },
  onSelectChange(e) {
    this.setState({ permission: e.target.value });
  },
  isEmailValid() {
    const isValidEmailAddress = this.state.email.match('.+@.+..+');
    return isValidEmailAddress;
  },
  checkEmpty() {
    let emptyFieldExists = false;

    if (_.isEmpty(this.state.name)) {
      this.setState({ nameErrorMessage: 'You must enter a name.' });
      emptyFieldExists = false;
    } else {
      this.setState({ nameErrorMessage: '' });
    }

    if (_.isEmpty(this.state.username)) {
      this.setState({ usernameErrorMessage: 'You must enter a username.' });
      emptyFieldExists = false;
    } else {
      this.setState({ usernameErrorMessage: '' });
    }

    if (_.isEmpty(this.state.password)) {
      this.setState({ passwordErrorMessage: 'You must enter a password.' });
      emptyFieldExists = false;
    } else {
      this.setState({ passwordErrorMessage: '' });
    }

    if (_.isEmpty(this.state.email)) {
      this.setState({ emailErrorMessage: 'You must enter an email.' });
      emptyFieldExists = false;
    } else {
      this.setState({ emailErrorMessage: '' });
    }

    return emptyFieldExists;
  },
  validateForm() {
    let enableSubmit = true;
    const formHasEmptyFields = this.checkEmpty();

    if (formHasEmptyFields) {
      enableSubmit = false;
    }

    const isValidEmailAddress = this.isEmailValid();
    if (!isValidEmailAddress) {
      this.setState({ emailErrorMessage: 'Invalid email.' });
      enableSubmit = false;
    } else {
      this.setState({ emailErrorMessage: '' });
    }

    return enableSubmit;
  },
  async submitFormAsync() {
    const enableSubmit = this.validateForm();
    if (!enableSubmit) {
      return;
    }
    const extra = {
      email: this.state.email,
      permission: this.state.permission,
      displayName: this.state.name,
    };
    // TODO surface error
    await this.props.onCreateUser(this.state.username, this.state.password, extra);

    // // TODO change to not reset if not successful?
    this.setState(this.getInitialState());
  },
  handleHotkey(e) {
    if (e.key === 'Enter') {
      this.submitFormAsync();
    }
  },
  render() {
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Create a new user'}</h3>
        </div>
        <div className="newItemFormInner">
          <label htmlFor={'fullName'} className="formLabel pt-label">
            Full name
            <input className="fullNameInput pt-input" onChange={this.onNameChange} value={this.state.name || ''} type="text" placeholder="Required" dir="auto" />
          </label>
          {this.state.nameErrorMessage &&
            <label htmlFor={'nameErrorMessage'} className="formError">{this.state.nameErrorMessage}</label>
          }
          <label htmlFor={'username'} className="formLabel pt-label">
            Username
            <input className="usernameInput pt-input" onChange={this.onUsernameChange} value={this.state.username || ''} type="text" placeholder="Required" dir="auto" />
          </label>
          {this.state.usernameErrorMessage &&
            <label htmlFor={'usernameErrorMessage'} className="formError">{this.state.usernameErrorMessage}</label>
          }
          <label htmlFor={'password'} className="formLabel pt-label">
            Password
            <input className="passwordInput pt-input" onChange={this.onPasswordChange} value={this.state.password || ''} type="password" placeholder="Required" dir="auto" />
          </label>
          {this.state.passwordErrorMessage &&
            <label htmlFor={'passwordErrorMessage'} className="formError">{this.state.passwordErrorMessage}</label>
          }
          <label htmlFor={'email'} className="formLabel pt-label">
            Email
            <input className="emailInput pt-input" onChange={this.onEmailChange} value={this.state.email || ''} type="text" placeholder="Required" dir="auto" />
          </label>
          {this.state.emailErrorMessage &&
            <label htmlFor={'emailErrorMessage'} className="formError">{this.state.emailErrorMessage}</label>
          }
          <label htmlFor={'permission'} className="formLabel pt-label">
            Permission
            <div className="permissionDropdown pt-select">
              <select className="pt-inline" onChange={this.onSelectChange}>
                <option value={PERMISSIONS.USER}>User</option>
                <option value={PERMISSIONS.MANAGER}>Manager</option>
                <option value={PERMISSIONS.ADMIN}>Admin</option>
              </select>
            </div>
          </label>
        </div>
        <div className="createItemContainer">
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.submitFormAsync}>{'Create user'}</button>
        </div>
      </div>
    );
  },
});

module.exports = NewUserView;
