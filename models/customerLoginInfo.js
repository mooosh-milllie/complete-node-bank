const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');
class CustomerLoginInfo extends Model {};

CustomerLoginInfo.init({
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: false
  },
  loginId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  city: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  region: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  country: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  ll: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: false
  },
  deviceType: {
    type: DataTypes.CHAR,
    allowNull: false
  }
},{
  sequelize,
  timestamps: true,
  modelName: 'login_info',
  underscored: true,
  freezeTableName: true,
})

module.exports = CustomerLoginInfo