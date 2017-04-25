const _ = require('lodash');
const React = require('react');
const Item = require('./../components/cards/item.js');
const PERMISSIONS = require('./../enums/permissions.js');

const ItemList = React.createClass({
  propTypes: {
    items: React.PropTypes.array.isRequired,
    permission: React.PropTypes.string.isRequired,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    users: React.PropTypes.array,
    updateItem: React.PropTypes.func.isRequired,
    deleteItem: React.PropTypes.func.isRequired,
    submitOrder: React.PropTypes.func.isRequired,
    onItemClick: React.PropTypes.func.isRequired,
    search: React.PropTypes.bool,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    dispatchAsLoan: React.PropTypes.func.isRequired,
    instancesObj: React.PropTypes.arrayOf(React.PropTypes.shape({
      itemId: React.PropTypes.number,
      itemName: React.PropTypes.string,
      instances: React.PropTypes.arrayOf(React.PropTypes.shape({
        instanceId: React.PropTypes.number,
        assetTag: React.PropTypes.number,
      })),
    })).isRequired,
    setItemInstancesObjByItemIds: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      users: [],
      itemLogs: [],
      search: null,
    };
  },
  getFieldsDataFromItemObj(itemObj) {
    // HACK we are hard coding removing keys from itemObj that
    // are not item fields. This should be replaced with a
    // less hacky way of feeding an object of fields & current
    // values for an item.
    const fieldsObj = {};
    _.forEach(itemObj, (value, key) => {
      const doNotAdd = (key === 'itemStatus') || (key === 'id');
      if (doNotAdd) {
        return;
      }
      fieldsObj[key] = value;
    });
    return fieldsObj;
  },
  getItem(itemObj) {
    const boundClick = this.loadItemDetailView.bind(null, itemObj);
    return (
      <div className="itemWrapper pt-card pt-interactive" key={itemObj.id} onClick={boundClick}>
        <Item
          key={itemObj.id}
          id={itemObj.id}
          name={itemObj.name}
          quantity={itemObj.quantity}
          tags={itemObj.tags}
          allTags={this.props.allTags}
          permission={this.props.permission}
          users={this.props.users}
          updateItem={this.props.updateItem}
          deleteItem={this.props.deleteItem}
          submitOrder={this.props.submitOrder}
          dispatchItem={this.props.submitOrder}
          includeTags={this.props.includeTags}
          customFields={this.props.customFields}
          fieldsData={this.getFieldsDataFromItemObj(itemObj)}
          dispatchAsLoan={this.props.dispatchAsLoan}
          isAsset={itemObj.isAsset}
          instancesObj={this.props.instancesObj}
          setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
        />
      </div>
    );
  },
  getNoItemsDialog() {
    return (
      <div className="nonIdealState pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-folder-open" />
        </div>
        <h4 className="pt-non-ideal-state-title">No items found</h4>
        {this.props.search &&
          <div className="pt-non-ideal-state-description">
            {'Try searching for a new item or hit \'Items\'.'}
          </div>
        }
        {((this.props.permission === PERMISSIONS.ADMIN) && (!this.props.search)) &&
          <div className="pt-non-ideal-state-description">
            {'Create a new item to populate this list.'}
          </div>
        }
      </div>
    );
  },
  loadItemDetailView(itemObj) {
    this.props.onItemClick(itemObj.id);
  },
  render() {
    const itemListEmpty = _.isEmpty(this.props.items);
    return (
      <div className="itemList navBarPadding">
        {itemListEmpty && this.getNoItemsDialog()}
        {!itemListEmpty && _.map(this.props.items, this.getItem)}
      </div>
    );
  },
});

module.exports = ItemList;
