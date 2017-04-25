const _ = require('lodash');
const React = require('react');
const Blueprint = require('@blueprintjs/core');
const Tags = require('./../../tagging/tags.js');
const PERMISSIONS = require('./../../../enums/permissions.js');

const FilterMenu = React.createClass({
  propTypes: {
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    excludeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    onSubmitItemsFilter: React.PropTypes.func.isRequired,
    closePopover: React.PropTypes.func.isRequired,
    filterMinThresh: React.PropTypes.bool.isRequired,
    toggleFilterMinThresh: React.PropTypes.func.isRequired,
    permission: React.PropTypes.string.isRequired,
  },
  getInitialState() {
    return {
      includeTagsModified: this.props.includeTags,
      excludeTagsModified: this.props.excludeTags,
      filterMinThresh: false,
    };
  },
  onIncludeTagsChange(tags) {
    const modifiedTags = _.map(tags, tag => tag.title);
    // set tags to unique version (don't allow duplicate tags)
    this.setState({ includeTagsModified: _.uniq(modifiedTags) });
  },
  onExcludeTagsChange(tags) {
    const modifiedTags = _.map(tags, tag => tag.title);
    // set tags to unique version (don't allow duplicate tags)
    this.setState({ excludeTagsModified: _.uniq(modifiedTags) });
  },
  onClearFilter() {
    if (this.props.filterMinThresh) {
      this.props.toggleFilterMinThresh();
    }
    this.setState({ includeTagsModified: [], excludeTagsModified: [] },
      () => this.handleAppleTagsClick(),
    );
  },
  handleAppleTagsClick() {
    if (!this.props.filterMinThresh) {
      this.props.onSubmitItemsFilter(this.state.includeTagsModified,
        this.state.excludeTagsModified);
      this.props.closePopover();
    }
  },
  toggleFilterMinThresh() {
    this.props.toggleFilterMinThresh();
  },
  render() {
    const applyButtonClass = this.props.filterMinThresh ?
    'confirmRequestButton pt-button pt-intent-primary pt-disabled' :
    'confirmRequestButton pt-button pt-intent-primary';
    const isUser = this.props.permission === PERMISSIONS.USER;

    return (
      <div className="filterMenu">
        <h6>Filter by tag</h6>
        <label htmlFor={'include'} className="formLabel pt-label">
          Include any of:
          <Tags
            activeTags={this.state.includeTagsModified}
            allTags={this.props.allTags}
            onActiveTagsChange={this.onIncludeTagsChange}
            addNew={false}
          />
        </label>
        <label htmlFor={'exlude'} className="formLabel pt-label">
          Exclude any of:
          <Tags
            activeTags={this.state.excludeTagsModified}
            allTags={this.props.allTags}
            onActiveTagsChange={this.onExcludeTagsChange}
            addNew={false}
          />
        </label>
        {!isUser &&
          <Blueprint.Switch checked={this.props.filterMinThresh} label="Only show items below min. threshold" onChange={this.toggleFilterMinThresh} />
        }
        <button
          className={applyButtonClass}
          onClick={this.handleAppleTagsClick}
        >
          {'Apply'}
        </button>
        <button className="cancelRequestButton pt-button" onClick={this.onClearFilter}>{'Clear'}</button>
      </div>
    );
  },
});

module.exports = FilterMenu;
