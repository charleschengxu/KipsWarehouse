const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const AccountMenu = require('./menus/accountMenu.js');
const AddMenu = require('./menus/addMenu.js');
const FilterMenuPopover = require('./menus/filterMenuPopover.js');
const SettingsMenu = require('./menus/settingsMenu.js');
const VIEWS = require('./../../enums/views.js');
const PERMISSIONS = require('./../../enums/permissions.js');

const NavBar = React.createClass({
  propTypes: {
    onUserAccountInfoClick: React.PropTypes.func.isRequired,
    onItemsClick: React.PropTypes.func.isRequired,
    onLogoutClick: React.PropTypes.func.isRequired,
    tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    statuses: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    view: React.PropTypes.number.isRequired,
    permission: React.PropTypes.string.isRequired,
    displayName: React.PropTypes.string,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    includeStatusTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeStatusTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    onSubmitItemsFilter: React.PropTypes.func.isRequired,
    onSubmitLogsFilter: React.PropTypes.func.isRequired,
    onSearchRequestsClick: React.PropTypes.func.isRequired,
    onSearchItemsClick: React.PropTypes.func.isRequired,
    onSearchLoansClick: React.PropTypes.func.isRequired,
    onUsersClick: React.PropTypes.func.isRequired,
    onChangeView: React.PropTypes.func.isRequired,
    onOrdersClick: React.PropTypes.func.isRequired,
    onLoansClick: React.PropTypes.func.isRequired,
    onLogsClick: React.PropTypes.func.isRequired,
    onBulkImport: React.PropTypes.func.isRequired,
    items: React.PropTypes.array.isRequired,
    users: React.PropTypes.array,
    filterMinThresh: React.PropTypes.bool.isRequired,
    toggleFilterMinThresh: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      displayName: '',
      users: [],
    };
  },
  getInitialState() {
    return {
      searchInput: '',
    };
  },
  getItemsButton() {
    const buttonClassNameRoot = 'pt-button pt-minimal';
    const isItemsView = (this.props.view === VIEWS.ITEMS);
    const itemsButtonClassName = isItemsView ?
      `${buttonClassNameRoot} pt-intent-primary` :
      buttonClassNameRoot;
    const tooltipContent = isItemsView ? 'Refresh item view' : 'Switch to items view';
    return (
      <Blueprint.Tooltip content={tooltipContent} position={Blueprint.Position.BOTTOM}>
        <button className={itemsButtonClassName} onClick={this.props.onItemsClick}>Items</button>
      </Blueprint.Tooltip>
    );
  },
  getOrdersButton() {
    const buttonClassNameRoot = 'pt-button pt-minimal';
    const isOrdersView = (this.props.view === VIEWS.ORDERS);
    const itemsButtonClassName = isOrdersView ?
      `${buttonClassNameRoot} pt-intent-primary` :
      buttonClassNameRoot;
    const tooltipContent = isOrdersView ? 'Refresh requests view' : 'Switch to requests view';
    return (
      <Blueprint.Tooltip content={tooltipContent} position={Blueprint.Position.BOTTOM}>
        <button className={itemsButtonClassName} onClick={this.props.onOrdersClick}>
          Requests
        </button>
      </Blueprint.Tooltip>
    );
  },
  getLoansButton() {
    const buttonClassNameRoot = 'pt-button pt-minimal';
    const isLoansView = (this.props.view === VIEWS.LOANS);
    const itemsButtonClassName = isLoansView ?
      `${buttonClassNameRoot} pt-intent-primary` :
      buttonClassNameRoot;
    const tooltipContent = isLoansView ? 'Refresh outstanding loans view' : 'Switch to outstanding loans view';
    return (
      <Blueprint.Tooltip content={tooltipContent} position={Blueprint.Position.BOTTOM}>
        <button className={itemsButtonClassName} onClick={this.props.onLoansClick}>Loans</button>
      </Blueprint.Tooltip>
    );
  },
  getLogsButton() {
    const buttonClassNameRoot = 'pt-button pt-minimal';
    const isLogsView = (this.props.view === VIEWS.LOGS);
    const itemsButtonClassName = isLogsView ?
      `${buttonClassNameRoot} pt-intent-primary` :
      buttonClassNameRoot;
    const tooltipContent = isLogsView ? 'Refresh logs view' : 'Switch to logs view';
    return (
      <Blueprint.Tooltip content={tooltipContent} position={Blueprint.Position.BOTTOM}>
        <button className={itemsButtonClassName} onClick={this.props.onLogsClick}>Logs</button>
      </Blueprint.Tooltip>
    );
  },
  getSearchBar() {
    const highlight = !_.isEmpty(this.state.searchInput);

    let placeholder;
    let className = `pt-input-group ${highlight && 'pt-intent-warning'}`;
    let disable = false;
    if (this.props.view === VIEWS.ITEMS) {
      placeholder = 'Search items';
    } else if (this.props.view === VIEWS.ORDERS) {
      placeholder = 'Search requests';
    } else if (this.props.view === VIEWS.LOANS) {
      placeholder = 'Search loans';
    } else {
      className += ' pt-disabled';
      disable = true;
    }

    return (
      <div className={className}>
        <span className="pt-icon pt-icon-search" />
        <input
          className="pt-input"
          type="search"
          disabled={disable}
          placeholder={placeholder}
          onChange={this.updateSearchInput}
          dir="auto"
        />
      </div>
    );
  },
  executeSearch() {
    if (this.props.view === VIEWS.ITEMS) {
      this.props.onSearchItemsClick(this.state.searchInput);
    } else if (this.props.view === VIEWS.LOANS) {
      this.props.onSearchLoansClick(this.state.searchInput);
    } else {
      this.props.onSearchRequestsClick(this.state.searchInput);
    }
  },
  updateSearchInput(e) {
    this.setState({ searchInput: e.target.value });
    const debouncedSearch = _.debounce(() => {
      this.executeSearch();
    }, 250);
    debouncedSearch();
  },
  render() {
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isPriviledgedUser = (this.props.permission === PERMISSIONS.ADMIN)
      || (this.props.permission === PERMISSIONS.MANAGER);
    return (
      <div className={isPriviledgedUser ? 'navBar pt-dark' : 'navBar'}>
        <nav className="pt-navbar pt-fixed-top">
          <div className="navBarInner">
            <div className="pt-navbar-group pt-align-left">
              <div className="pt-navbar-heading pt-button pt-minimal"onClick={this.props.onItemsClick}>{'Kip\'s Warehouse'}</div>
              {this.getSearchBar()}
              <FilterMenuPopover
                tags={this.props.tags}
                excludeTags={this.props.excludeTags}
                includeTags={this.props.includeTags}
                includeStatusTags={this.props.includeStatusTags}
                excludeStatusTags={this.props.excludeStatusTags}
                onSubmitItemsFilter={this.props.onSubmitItemsFilter}
                onSubmitLogsFilter={this.props.onSubmitLogsFilter}
                view={this.props.view}
                statuses={this.props.statuses}
                items={this.props.items}
                users={this.props.users}
                filterMinThresh={this.props.filterMinThresh}
                toggleFilterMinThresh={this.props.toggleFilterMinThresh}
                permission={this.props.permission}
              />
            </div>
            <div className="pt-navbar-group pt-align-right">
              {this.getItemsButton()}
              {this.getOrdersButton()}
              {this.getLoansButton()}
              {isPriviledgedUser &&
                this.getLogsButton()
              }
              <span className="pt-navbar-divider" />
              {!isPriviledgedUser &&
              <button
                className="pt-button pt-minimal pt-icon-shopping-cart"
                onClick={this.props.onChangeView.bind(null, VIEWS.CART)}
              />
              }
              {isPriviledgedUser &&
              <AddMenu
                onChangeView={this.props.onChangeView}
                onBulkImport={this.props.onBulkImport}
                permission={this.props.permission}
              />
              }
              {isPriviledgedUser &&
              <SettingsMenu
                onChangeView={this.props.onChangeView}
                permission={this.props.permission}
              />
              }
              <AccountMenu
                onUserAccountInfoClick={this.props.onUserAccountInfoClick}
                onLogoutClick={this.props.onLogoutClick}
                displayName={this.props.displayName}
                onUsersClick={this.props.onUsersClick}
                permission={this.props.permission}
              />
            </div>
          </div>
        </nav>
      </div>
    );
  },
});

module.exports = NavBar;
