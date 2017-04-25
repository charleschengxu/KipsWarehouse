const _ = require('lodash');
const React = require('react');
const LogEntry = require('./../components/cards/logEntry.js');

const LogList = React.createClass({
  propTypes: {
    itemLogs: React.PropTypes.array.isRequired,
    onItemClick: React.PropTypes.func.isRequired,
    hideItemButton: React.PropTypes.bool.isRequired,
    onOrderClick: React.PropTypes.func.isRequired,
    addPadding: React.PropTypes.bool,
  },
  getDefaultProps() {
    return {
      addPadding: true,
    };
  },
  getLogEntry(logEntry) {
    return (
      <div className="itemWrapper pt-card" key={logEntry.id}>
        <LogEntry
          content={logEntry.content}
          item={logEntry.item}
          bundle={logEntry.bundle}
          onItemClick={this.props.onItemClick}
          hideItemButton={this.props.hideItemButton}
          onOrderClick={this.props.onOrderClick}
          createdAt={logEntry.createdAt}
        />
      </div>
    );
  },
  render() {
    const className = this.props.addPadding ? 'logListContainer navBarPadding' : 'logListContainer';
    return (
      <div className={className}>
        {_.map(this.props.itemLogs, this.getLogEntry)}
      </div>
    );
  },
});

module.exports = LogList;
