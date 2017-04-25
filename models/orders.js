/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('orders', {
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
    itemId: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    bundleId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    orderType: {
      type: DataTypes.ENUM('LOAN','DISBURSE'),
      allowNull: false,
      defaultValue: "DISBURSE"
    },
    orderStatus: {
      type: DataTypes.ENUM('APPROVED','PENDING','DENIED','CARTED','DISPATCHED','RETURNED'),
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
    tableName: 'orders'
  });
};
