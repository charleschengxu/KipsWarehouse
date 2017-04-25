const React = require('react');
const Blueprint = require('@blueprintjs/core');

const AccountMenu = React.createClass({
  propTypes: {
    onUserAccountInfoClick: React.PropTypes.func.isRequired,
    onLogoutClick: React.PropTypes.func.isRequired,
    displayName: React.PropTypes.string,
    // onUsersClick: React.PropTypes.func.isRequired,
    // permission: React.PropTypes.string.isRequired,
  },
  getDefaultProps() {
    return {
      displayName: '',
    };
  },
  getAccountMenuItems() {
    return (
      <div className="accountMenu">
        <Blueprint.Menu>
          <u1 className="menuUserLabel">Signed in as <strong>{this.props.displayName}</strong></u1>
          <Blueprint.MenuDivider />
          <Blueprint.MenuItem
            iconName="pt-icon-user"
            onClick={this.props.onUserAccountInfoClick}
            text="Your Account"
          />
          <Blueprint.MenuDivider />
          <Blueprint.MenuItem
            iconName="pt-icon-log-out"
            onClick={this.props.onLogoutClick}
            text="Sign out"
          />
        </Blueprint.Menu>
      </div>
    );
  },
  render() {
    return (
      <div className="accountMenuPopover">
        <Blueprint.Popover
          content={this.getAccountMenuItems()}
          position={Blueprint.Position.BOTTOM_RIGHT}
        >
          <Blueprint.Tooltip content={'View profile and more'} position={Blueprint.Position.BOTTOM_RIGHT} isDisabled>
            <button className="pt-button pt-minimal pt-icon-user" />
          </Blueprint.Tooltip>
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = AccountMenu;
