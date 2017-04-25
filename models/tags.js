/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const Tags = sequelize.define('tags', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    description: {
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
    tableName: 'tags',
    classMethods: {
      associate: function(models) {
        Tags.hasMany(models.item_tag_pairs)
      }
    }
  });
  return Tags;
};
