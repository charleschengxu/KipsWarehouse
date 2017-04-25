const React = require('react');

const MinStockEntry = React.createClass({
  propTypes: {
    itemObj: React.PropTypes.object.isRequired,
  },
  render() {
    return (
      <div>
        <div className="item">
          <label
            htmlFor={this.props.itemObj.name}
            className="itemLabel pt-ui-text-large"
          >
            {this.props.itemObj.name}
          </label>
          <div className="locationAndModelLabel">
            <label htmlFor={'fieldTypeLabel'} className="modelLabel pt-running-text-small">{'Minimum stock quantity: '}</label>
            <label
              htmlFor={this.props.itemObj.threshold}
              className="modelLabel pt-running-text-small"
            >
              {this.props.itemObj.threshold}
            </label>
          </div>
        </div>
      </div>
    );
  },
});

module.exports = MinStockEntry;
