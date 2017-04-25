const _ = require('lodash');
const React = require('react');

const ItemTags = React.createClass({
  propTypes: {
    tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string),
  },
  getDefaultProps() {
    return {
      includeTags: [],
    };
  },
  getTag(tag) {
    const emphasize = _.includes(this.props.includeTags, tag);
    const className = emphasize ? 'pt-tag pt-intent-warning' : 'pt-tag';
    return (
      <label htmlFor={tag} className="itemTagContainer" key={tag}>
        <span className={className} key={tag}>
          {tag}
        </span>
      </label>
    );
  },
  render() {
    return (
      <div className="itemTags">
        {_.map(this.props.tags, this.getTag)}
      </div>
    );
  },
});

module.exports = ItemTags;
