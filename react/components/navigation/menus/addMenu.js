const React = require('react');
const Blueprint = require('@blueprintjs/core');
const VIEWS = require('./../../../enums/views.js');
const PERMISSIONS = require('./../../../enums/permissions.js');

const AddMenu = React.createClass({
  propTypes: {
    onChangeView: React.PropTypes.func.isRequired,
    onBulkImport: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getAddMenuItems() {
    const isAdminUser = (this.props.permission === PERMISSIONS.ADMIN);
    const isPriviledgedUser = isAdminUser ||
      (this.props.permission === PERMISSIONS.MANAGER);
    return (
      <div className="accountMenu">
        <Blueprint.Menu>
          {isAdminUser &&
            <Blueprint.MenuItem
              onClick={this.props.onChangeView.bind(null, VIEWS.NEWFIELD)}
              iconName={'manually-entered-data'}
              text={'New custom field'}
            />
          }
          <Blueprint.MenuItem
            onClick={this.props.onChangeView.bind(null, VIEWS.NEWITEM)}
            iconName={'new-object'}
            text="New item"
          />
          {isAdminUser &&
            <Blueprint.MenuItem
              onClick={this.props.onChangeView.bind(null, VIEWS.NEWUSER)}
              iconName={'new-person'}
              text={'New user'}
            />
          }
          {isAdminUser &&
            <Blueprint.MenuItem
              onClick={this.props.onChangeView.bind(null, VIEWS.BULKIMPORT)}
              iconName={'upload'}
              text={'Bulk import'}
            />
          }
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
          <button className="pt-button pt-minimal pt-icon-plus" />
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = AddMenu;
