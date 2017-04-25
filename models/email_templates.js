/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('email_templates', {
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
    preamble: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    templateName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    }
  }, {
    tableName: 'email_templates'
  });
};
