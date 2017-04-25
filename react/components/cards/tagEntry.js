const React = require('react');
const DeleteItemPopover = require('./../popovers/deleteItemPopover.js');

const TagEntry = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    deleteTag: React.PropTypes.func.isRequired,
  },
  render() {
    return (
      <div>
        <DeleteItemPopover
          id={this.props.id}
          name={this.props.name}
          onDeleteItemClick={this.props.deleteTag}
        />
        <div className="item logEntry">
          {this.props.name}
        </div>
      </div>
    );
  },
});

module.exports = TagEntry;
