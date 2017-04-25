/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('instance_custom_fields', {
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
    type: {
      type: DataTypes.ENUM('SHORT','LONG','INT','FLOAT'),
      allowNull: false,
      defaultValue: "LONG"
    },
    visibility: {
      type: DataTypes.ENUM('PRIVATE','PUBLIC'),
      allowNull: false,
      defaultValue: "PRIVATE"
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    }
  }, {
    tableName: 'instance_custom_fields'
  });
};
