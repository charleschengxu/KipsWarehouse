const React = require('react');
const Blueprint = require('@blueprintjs/core');
const VIEWS = require('./../../enums/views.js');

const SearchMenuPopover = React.createClass({
  propTypes: {
    onSearchClick: React.PropTypes.func.isRequired,
    view: React.PropTypes.number.isRequired,
  },
  getInitialState() {
    return {
      searchInput: '',
      isOpen: false,
    };
  },
  updateSearchInput(e) {
    this.setState({ searchInput: e.target.value });
  },
  executeSearch() {
    this.setState({ isOpen: false });
    this.props.onSearchClick(this.state.searchInput);
  },
  handlePopoverInteraction() {
    const nextState = !this.state.isOpen;
    this.setState({ isOpen: nextState });
  },
  render() {
    const placeholder = (this.props.view === VIEWS.ITEMS) ?
      'Search items' :
      'Search requests';

    const popoverContent = (
      <div className="searchMenu pt-card">
        <div className="pt-input-group">
          <span className="pt-icon pt-icon-search" />
          <input
            className="pt-input"
            type="search"
            placeholder={placeholder}
            onChange={this.updateSearchInput}
            dir="auto"
          />
          <button className="pt-button pt-minimal" onClick={this.executeSearch}>Go</button>
        </div>
      </div>
    );

    return (
      <div className="accountMenuPopover">
        <Blueprint.Popover
          content={popoverContent}
          position={Blueprint.Position.BOTTOM_RIGHT}
          isOpen={this.state.isOpen}
          onInteraction={state => this.handlePopoverInteraction(state)}
        >
          <button className="pt-button pt-minimal pt-icon-search">Search</button>
        </Blueprint.Popover>
      </div>
    );
  },
});

module.exports = SearchMenuPopover;
