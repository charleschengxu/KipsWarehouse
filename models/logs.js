/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('logs', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    srcUserId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    destUserId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    itemId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    bundleId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
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
    instanceId: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'logs'
  });
};
