const _ = require('lodash');
const React = require('react');
const TagEntry = require('./../components/cards/tagEntry.js');

const TagsList = React.createClass({
  propTypes: {
    tags: React.PropTypes.array,
    deleteTag: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      tags: [],
    };
  },
  getTag(tag) {
    return (
      <div className="itemWrapper pt-card" key={tag.id}>
        <TagEntry
          name={tag.name}
          id={tag.id}
          deleteTag={this.props.deleteTag}
        />
      </div>
    );
  },
  render() {
    return (
      <div className="itemList">
        {_.map(this.props.tags, this.getTag)}
      </div>
    );
  },
});

module.exports = TagsList;
