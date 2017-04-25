const React = require('react');

const LogEntry = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    item: React.PropTypes.object,
    bundle: React.PropTypes.object,
    onItemClick: React.PropTypes.func.isRequired,
    hideItemButton: React.PropTypes.bool.isRequired,
    onOrderClick: React.PropTypes.func.isRequired,
    createdAt: React.PropTypes.string.isRequired,
  },
  getDefaultProps() {
    return {
      bundle: null,
      item: null,
    };
  },
  getDateString() {
    const date = new Date(this.props.createdAt);
    const displayMonth = date.getMonth() + 1;
    const displayDay = date.getDate();
    const displayYear = date.getFullYear();
    return `${displayMonth}/${displayDay}/${displayYear}`;
  },
  handleItemClick() {
    this.props.onItemClick(this.props.item.id);
  },
  handleGoToRequestClick() {
    this.props.onOrderClick(this.props.bundle.id);
  },
  render() {
    const dateString = this.getDateString();
    return (
      <div className="item">
        <label htmlFor={'logEntryContent'} className="pt-running-text-small">
          {this.props.content}
        </label>
        <div className="itemParameters">
          <div className="locationAndModelLabel">
            <label
              htmlFor={'createdOnTitle'}
              className="modelLabel pt-running-text-small"
            >
              {'Created on: '}
            </label>
            <label
              htmlFor={dateString}
              className="modelLabel pt-running-text-small"
            >
              {dateString}
            </label>
          </div>
          <div className="locationAndModelLabel logButtonContainer">
            {this.props.bundle &&
              <button
                className="logButton pt-button pt-minimal pt-intent-primary"
                onClick={this.handleGoToRequestClick}
              >
              Go to request
              </button>
            }
            {this.props.item && !this.props.hideItemButton &&
              <button
                className="logButton pt-minimal pt-button pt-intent-primary"
                onClick={this.handleItemClick}
              >
              Go to item
              </button>
            }
          </div>
        </div>
      </div>
    );
  },
});

module.exports = LogEntry;
