const React = require('react');
const Blueprint = require('@blueprintjs/core');
const VIEWS = require('./../../../enums/views.js');
const PERMISSIONS = require('./../../../enums/permissions.js');

const SettingsMenu = React.createClass({
  propTypes: {
    onChangeView: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getAddMenuItems() {
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    return (
      <div className="accountMenu">
        <Blueprint.Menu>
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.FIELDS)}
            iconName={'list'}
            text={'Manage fields'}
          />
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.TAGS)}
            iconName={'tag'}
            text={'Remove tags'}
          />
          {isAdmin &&
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.USERS)}
            iconName={'people'}
            text={'Manage users'}
          />
          }
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.CONFIGEMAIL)}
            iconName={'envelope'}
            text={'Configure email'}
          />
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.MINIMUMSTOCK)}
            iconName={'wrench'}
            text={'Manage min. stock'}
          />
        </Blueprint.Menu>
      </div>
    );
  },
  render() {
    return (
      <div className="accountMenuPopover">
        <Blueprint.Popover
          content={this.getAddMenuItems()}
          position={Blueprint.Position.BOTTOM_RIGHT}
        >
          <button className="pt-button pt-minimal pt-icon-cog" />
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = SettingsMenu;
