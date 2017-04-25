/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var InstanceFieldValues =  sequelize.define('instance_custom_field_values', {
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
    },
    itemInstanceId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'item_instances',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    }
  }, {
    tableName: 'instance_custom_field_values',
    classMethods: {
      associate: function(models) {
        InstanceFieldValues.belongsTo(models.item_instances)
      }
    }
  });
  return InstanceFieldValues;
};
