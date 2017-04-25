/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('order_bundles', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    bundleType: {
      type: DataTypes.ENUM('LOAN','DISBURSE','MIX'),
      allowNull: false,
      defaultValue: "DISBURSE"
    },
    bundleStatus: {
      type: DataTypes.ENUM('APPROVED','DENIED','PENDING','DISPATCHED','RETURNED'),
      allowNull: false,
      defaultValue: "PENDING"
    },
    userComment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adminComment: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'order_bundles'
  });
};
