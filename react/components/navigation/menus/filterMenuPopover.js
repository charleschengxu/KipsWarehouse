const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const FilterMenu = require('./filterMenu.js');
const LogsFilterMenu = require('./logsFilterMenu.js');
const VIEWS = require('./../../../enums/views.js');

const FilterMenuPopover = React.createClass({
  propTypes: {
    tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    onSubmitItemsFilter: React.PropTypes.func.isRequired,
    onSubmitLogsFilter: React.PropTypes.func.isRequired,
    statuses: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    view: React.PropTypes.number.isRequired,
    items: React.PropTypes.array.isRequired,
    users: React.PropTypes.array.isRequired,
    filterMinThresh: React.PropTypes.bool.isRequired,
    toggleFilterMinThresh: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getInitialState() {
    return {
      isOpen: false,
    };
  },
  getFilterPopoverContent() {
    const isItemsView = (this.props.view === VIEWS.ITEMS);
    return (
      <div className="filterPopoverContent">
        {isItemsView ?
          <FilterMenu
            allTags={this.props.tags}
            excludeTags={this.props.excludeTags}
            includeTags={this.props.includeTags}
            onSubmitItemsFilter={this.props.onSubmitItemsFilter}
            closePopover={this.closePopover}
            filterMinThresh={this.props.filterMinThresh}
            toggleFilterMinThresh={this.props.toggleFilterMinThresh}
            permission={this.props.permission}
          /> :
          <LogsFilterMenu
            items={this.props.items}
            users={this.props.users}
            onSubmitLogsFilter={this.props.onSubmitLogsFilter}
            closePopover={this.closePopover}
          />
        }
      </div>
    );
  },
  getFilterButtonIntent() {
    if (this.props.view !== VIEWS.ITEMS && this.props.view !== VIEWS.LOGS) {
      return '';
    }
    const filterActive = (!_.isEmpty(this.props.includeTags) || !_.isEmpty(this.props.excludeTags))
      || this.props.filterMinThresh;
    return (filterActive) ? 'pt-intent-warning' : '';
  },
  handlePopoverInteraction() {
    const nextState = !this.state.isOpen;
    this.setState({ isOpen: nextState });
  },
  closePopover() {
    this.setState({ isOpen: false });
  },
  render() {
    const isItemsView = this.props.view === VIEWS.ITEMS;
    const noData = isItemsView ? _.isEmpty(this.props.tags) : _.isEmpty(this.props.statuses);
    const itemsOrLogsView = (this.props.view === VIEWS.ITEMS) || (this.props.view === VIEWS.LOGS);
    const filterDisabled = !itemsOrLogsView || noData;
    const noTags = `Admin user has not enabled any ${isItemsView ? 'tags' : 'statuses'}`;
    const noView = 'Filtering is not yet enabled for this view';
    const tooltipText = (this.props.view === VIEWS.ITEMS) ? noTags : noView;
    const filterButtonIntent = this.getFilterButtonIntent();
    return (
      <div>
        {!filterDisabled &&
        <Blueprint.Popover
          content={this.getFilterPopoverContent()}
          position={Blueprint.Position.BOTTOM_LEFT}
          isOpen={this.state.isOpen && !filterDisabled}
          onInteraction={state => this.handlePopoverInteraction(state)}
        >
          <Blueprint.Tooltip
            content={tooltipText}
            position={Blueprint.Position.BOTTOM}
            isDisabled={!noData}
          >
            <button
              className={`pt-button pt-minimal pt-icon-filter ${filterButtonIntent}`}
              disabled={filterDisabled}
            >
              Filter
            </button>
          </Blueprint.Tooltip>
        </Blueprint.Popover>
      }
      </div>
    );
  },
});

module.exports = FilterMenuPopover;
