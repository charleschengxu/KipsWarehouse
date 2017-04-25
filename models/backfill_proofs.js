/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('backfill_proofs', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    fileHandle: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backfillStatus: {
      type: DataTypes.ENUM('PENDING','APPROVED','DENIED'),
      allowNull: false,
      defaultValue: "PENDING"
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
    tableName: 'backfill_proofs'
  });
};
