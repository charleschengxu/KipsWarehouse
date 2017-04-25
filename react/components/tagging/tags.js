const _ = require('lodash');
const React = require('react');
const TagInput = require('react-categorized-tag-input');

const Tags = React.createClass({
  propTypes: {
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    activeTags: React.PropTypes.arrayOf(React.PropTypes.string),
    onActiveTagsChange: React.PropTypes.func.isRequired,
    addNew: React.PropTypes.bool.isRequired,
  },
  getDefaultProps() {
    return {
      activeTags: [],
    };
  },
  onTagsChange(tags) {
    this.props.onActiveTagsChange(tags);
  },
  getCurrentTags() {
  // map to array of tag objects that can be fed into TagInput
  // hard-coded to category 1
    return _.map(this.props.activeTags, tag => ({ title: tag, category: '1' }));
  },
  render() {
    // hard coding categories (since we only need 1)
    // TODO surface error if multiple tags created
    const categories = [{
      id: '1',
      type: 'tag',
      title: 'tag',
      items: this.props.allTags,
    }];
    return (
      <div className="tagBox">
        <TagInput
          categories={categories}
          addNew={this.props.addNew}
          onChange={this.onTagsChange}
          value={this.getCurrentTags()}
        />
      </div>
    );
  },
});

module.exports = Tags;
