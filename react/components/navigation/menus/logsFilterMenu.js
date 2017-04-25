const _ = require('lodash');
const React = require('react');
const BlueprintDateTime = require('@blueprintjs/datetime');

const LogsFilterMenu = React.createClass({
  propTypes: {
    items: React.PropTypes.array.isRequired,
    users: React.PropTypes.array.isRequired,
    onSubmitLogsFilter: React.PropTypes.func.isRequired,
    closePopover: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      dateRange: [null, null],
      selectedUser: null,
      selectedItem: null,
    };
  },
  onUserSelectChange(e) {
    // We use the value to store the user's id.
    this.setState({ selectedUser: e.target.value });
  },
  onItemSelectChange(e) {
    // We use the value to store the user's id.
    this.setState({ selectedItem: e.target.value });
  },
  getPossibleAssignees() {
    // We use the value to store the user's id.
    return _.map(this.props.users, (user) => {
      const assigneeOption = (<option key={user.id} value={user.id}>{user.username}</option>);
      return assigneeOption;
    });
  },
  getAssignToDropdown() {
    return (
      <label htmlFor={'filterByUser'} className="pt-label pt-inline">
        Filter by user
        <div className="pt-select">
          <select onChange={this.onUserSelectChange}>
            <option selected>Choose a user...</option>
            {this.getPossibleAssignees()}
          </select>
        </div>
      </label>
    );
  },
  getPossibleItems() {
    // We use the value to store the user's id.
    return _.map(this.props.items, (item) => {
      const itemOption = (<option key={item.id} value={item.id}>{item.name}</option>);
      return itemOption;
    });
  },
  getItemsDropDown() {
    return (
      <label htmlFor={'filterByItem'} className="pt-label pt-inline">
        Filter by item
        <div className="pt-select">
          <select onChange={this.onItemSelectChange}>
            <option selected>Choose an item...</option>
            {this.getPossibleItems()}
          </select>
        </div>
      </label>
    );
  },
  handleDateChange(dateRange) {
    this.setState({ dateRange });
  },
  applyFilter() {
    const fromTime = this.state.dateRange[0] || null;
    const toTime = this.state.dateRange[1] || null;
    const query = {
      userId: this.state.selectedUser || null,
      fromTime,
      toTime,
      itemId: this.state.selectedItem || null,
    };
    this.props.onSubmitLogsFilter(query);
    this.props.closePopover();
  },
  removeFilter() {
    this.setState(this.getInitialState());
    this.props.onSubmitLogsFilter({});
    this.props.closePopover();
  },
  render() {
    return (
      <div className="filterMenu">
        <BlueprintDateTime.DateRangePicker
          className="dateTime"
          value={this.state.dateRange}
          onChange={this.handleDateChange}
        />
        {this.getAssignToDropdown()}
        {this.getItemsDropDown()}
        <button
          className="confirmRequestButton pt-button pt-intent-primary"
          onClick={this.applyFilter}
        >
          {'Apply'}
        </button>
        <button
          className="cancelRequestButton pt-button"
          onClick={this.removeFilter}
        >
          {'Clear'}
        </button>
      </div>
    );
  },
});

module.exports = LogsFilterMenu;
