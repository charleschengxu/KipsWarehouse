/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reminder_dates', {
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
    date: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'reminder_dates'
  });
};
