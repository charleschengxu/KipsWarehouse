/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var Instances = sequelize.define('item_instances', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    itemId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    assetTag: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    instanceStatus: {
      type: DataTypes.ENUM('AVAILABLE','DISBURSE','LOAN','DELETED'),
      allowNull: false,
      defaultValue: "AVAILABLE"
    }
  }, {
    tableName: 'item_instances',
    classMethods: {
      associate: function(models) {
        Instances.hasMany(models.instance_custom_field_values)
      }
    }
  });
  return Instances;
};
