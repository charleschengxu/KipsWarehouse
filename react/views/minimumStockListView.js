const _ = require('lodash');
const React = require('react');
const MinStockEntry = require('./../components/cards/minStockEntry.js');

const MinimumStockListView = React.createClass({
  propTypes: {
    items: React.PropTypes.array,
    setMinStockThreshold: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      selectedItems: new Set(),
      threshold: 0,
      thresholdErrorMessage: '',
    };
  },
  getDefaultProps() {
    return {
      items: [],
    };
  },
  getItem(item) {
    const boundClick = this.toggleItem.bind(null, item.id);
    const className = this.state.selectedItems.has(item.id) ? "itemWrapper pt-card pt-interactive pt-callout pt-intent-success" : "itemWrapper pt-card pt-interactive";

    return (
      <div className={className} key={item.id} onClick={boundClick}>
        <MinStockEntry
          itemObj={item}
          toggleItem={this.toggleItem}
        />
      </div>
    );
  },
  toggleItem(itemId) {
    const selected = this.state.selectedItems;
    if (this.state.selectedItems.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    this.setState({
      selectedItems: selected,
    });
  },
  onThresholdChange(e){
    e.stopPropagation();
    const value = e.target.value;
    const isNumber = value.match('^[0-9][0-9]*$');

    if (!isNumber) {
      this.setState({ threshold: value, thresholdErrorMessage: 'Invalid threshold.' });
    } else {
      this.setState({ threshold: value, thresholdErrorMessage: '' });
    }
  },
  getNoItemsDialog() {
    return (
      <div className="nonIdealState pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-folder-open" />
        </div>
        <h4 className="pt-non-ideal-state-title">No items created</h4>
      </div>
    );
  },
  submitUpdatedThresholds(){
    if(this.state.selectedItems.size > 0) {
      this.props.setMinStockThreshold(this.state.selectedItems, this.state.threshold);
      this.setState({
        selectedItems: new Set(),
        threshold: 0,
        thresholdErrorMessage: '',
      });
    }
  },
  selectAll(){
    let all = new Set();
    _.forEach(this.props.items, function(item) {
      all.add(item.id);
    });
    this.setState({
      selectedItems: all,
    });
  },
  selectNone(){
    this.setState({
      selectedItems: new Set(),
    });
  },
  render() {
    const isEmpty = _.isEmpty(this.props.items);
    const updateButtonClassname = (this.state.selectedItems.size > 0) ? "pt-button pt-intent-primary updateButton" : "pt-button pt-intent-primary updateButton pt-disabled";

    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">Select items below to update minimum stock</h3>
          <label htmlFor={'quantity'} className="formLabel pt-label">
            Threshold:
            {this.state.thresholdErrorMessage &&
              <label htmlFor={'quantityErrorMessage'} className="formError">{this.state.thresholdErrorMessage}</label>
            }
            <input
              className="quantityInput pt-input"
              onChange={this.onThresholdChange}
              value={this.state.threshold}
              type="text"
              placeholder="Required"
              dir="auto"
            />
          </label>
          <button className={updateButtonClassname} onClick={this.submitUpdatedThresholds}>{'Update'}</button>
          <button className="pt-button selectButton" onClick={this.selectAll}>{'Select all'}</button>
          <button className="pt-button selectButton" onClick={this.selectNone}>{'Select none'}</button>
        </div>
        <div className="newItemFormInner">
          <div className="itemList">
            {isEmpty ?
              this.getNoItemsDialog() :
              _.map(this.props.items, this.getItem)
            }
          </div>
        </div>
      </div>
    );
  },
});

module.exports = MinimumStockListView;
