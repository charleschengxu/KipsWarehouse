const React = require('react');
const ItemTags = require('./../tagging/itemTags.js');
const SubmitRequestPopover = require('./../popovers/submitRequestPopover.js');
const DispatchToUser = require('./../popovers/dispatchToUser.js');
const ModifyItemPopover = require('./../popovers/modifyItemPopover.js');
const DeleteItemPopover = require('./../popovers/deleteItemPopover.js');
const PERMISSIONS = require('./../../enums/permissions.js');

const Item = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    quantity: React.PropTypes.number.isRequired,
    tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    allTags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    customFields: React.PropTypes.arrayOf(React.PropTypes.shape({
      fieldName: React.PropTypes.string,
      visibility: React.PropTypes.string,
      fieldType: React.PropTypes.string,
    })).isRequired,
    fieldsData: React.PropTypes.object.isRequired,
    permission: React.PropTypes.string.isRequired,
    users: React.PropTypes.array,
    updateItem: React.PropTypes.func.isRequired,
    deleteItem: React.PropTypes.func.isRequired,
    submitOrder: React.PropTypes.func.isRequired,
    dispatchItem: React.PropTypes.func.isRequired,
    includeTags: React.PropTypes.arrayOf(React.PropTypes.string),
    dispatchAsLoan: React.PropTypes.func.isRequired,
    isAsset: React.PropTypes.number.isRequired,
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
      includeTags: [],
      users: [],
    };
  },
  render() {
    const initialQuantity = 1;
    const isManager = (this.props.permission === PERMISSIONS.MANAGER);
    const isUser = (this.props.permission === PERMISSIONS.USER);
    const isAdmin = (this.props.permission === PERMISSIONS.ADMIN);
    const isPriviledgedUser = isManager || isAdmin;
    return (
      <div className="item">
        <label
          htmlFor={this.props.name}
          className="itemLabel pt-ui-text-large"
        >
          {this.props.name}
        </label>
        <label htmlFor={'quantity'} className="numberRemainingLabel pt-running-text-small">
          {this.props.quantity}
        </label>
        {isUser &&
          <div className="addToCart">
            <SubmitRequestPopover
              name={this.props.name}
              id={this.props.id}
              maxQuantity={this.props.quantity}
              quantity={initialQuantity}
              submitOrder={this.props.submitOrder}
            />
          </div>
        }
        {isAdmin &&
          <DeleteItemPopover
            id={this.props.id}
            name={this.props.name}
            onDeleteItemClick={this.props.deleteItem}
          />
        }
        {isPriviledgedUser &&
          <ModifyItemPopover
            id={this.props.id}
            name={this.props.name}
            quantity={this.props.quantity}
            allTags={this.props.allTags}
            customFields={this.props.customFields}
            fieldsData={this.props.fieldsData}
            onUpdateItem={this.props.updateItem}
            isManager={isManager}
            isAsset={this.props.isAsset}
          />
        }
        {isPriviledgedUser &&
          <DispatchToUser
            maxQuantity={this.props.quantity}
            initialQuantity={initialQuantity}
            id={this.props.id}
            name={this.props.name}
            users={this.props.users}
            dispatchItem={this.props.dispatchItem}
            dispatchAsLoan={this.props.dispatchAsLoan}
            isAsset={this.props.isAsset}
            instancesObj={this.props.instancesObj}
            setItemInstancesObjByItemIds={this.props.setItemInstancesObjByItemIds}
          />
        }
        <div className="itemParameters">
          {this.props.fieldsData.model &&
            <div className="locationAndModelLabel">
              <label htmlFor={'modelTitle'} className="modelLabel pt-running-text-small">{'Model: '}</label>
              <label
                htmlFor={this.props.fieldsData.model}
                className="modelLabel pt-running-text-small"
              >
                {this.props.fieldsData.model}
              </label>
            </div>
          }
          {this.props.fieldsData.description &&
            <label htmlFor={'description'} className="description pt-running-text-small">
              {`Description: ${this.props.fieldsData.description}`}
            </label>
          }
          <ItemTags
            tags={this.props.tags}
            permission={this.props.permission}
            includeTags={this.props.includeTags}
          />
        </div>
      </div>
    );
  },
});

module.exports = Item;
