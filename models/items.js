/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const Items = sequelize.define('items', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    quantity: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    isAsset: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    itemStatus: {
      type: DataTypes.ENUM('ACTIVE','INACTIVE'),
      allowNull: false,
      defaultValue: "ACTIVE"
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    threshold: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'items',
    classMethods: {
      associate: function(models) {
        Items.hasMany(models.item_tag_pairs)
        Items.hasMany(models.custom_field_values)
      }
    }
  });
  return Items;
};
