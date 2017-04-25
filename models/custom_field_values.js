/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var FieldValues = sequelize.define('custom_field_values', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      references: {
        model: 'custom_fields',
        key: 'name'
      }
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true
    },
    itemId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'items',
        key: 'id'
      }
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
    tableName: 'custom_field_values',
    classMethods: {
      associate: function(models) {
        FieldValues.belongsTo(models.items)
      }
    }
  });
  return FieldValues;
};
