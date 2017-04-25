/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const ItemTags = sequelize.define('item_tag_pairs', {
    itemId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'items',
        key: 'id'
      }
    },
    tagId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'item_tag_pairs',
    classMethods: {
      associate: function(models) {
        ItemTags.belongsTo(models.tags)
        ItemTags.belongsTo(models.items)
      }
    }
  });
  return ItemTags;
};
