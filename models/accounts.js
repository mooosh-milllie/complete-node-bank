const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

const ACCOUNT_BALANCE_DEFAULT_VALUE = 0;

class Accounts extends Model {};

Accounts.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  accountNumber: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique:true,
    validate: {
      isNumberOfDigits(value) {
        if (String(value).length < 10 || String(value).length > 10) {
          throw new Error('account number should be 10 digits');
        }
      }
    }
  },
  accountType: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  pin: {
    allowNull: false,
    type: DataTypes.INTEGER,
    defaultValue: Math.floor(100000 + Math.random() * 900000),
    validate: {
      isNumberOfDigits(value) {
        if (String(value).length < 4 || String(value).length > 7) {
          throw new Error('Pin digits should not be below 4 or above 6');
        }
      }
    }
  },
  accountStatus: {
    allowNull: false,
    type: DataTypes.STRING,
    defaultValue: "active",
  },
  availableBalance: {
    allowNull: false,
    type: DataTypes.BIGINT,
    defaultValue: ACCOUNT_BALANCE_DEFAULT_VALUE
  },
  currentBalance: {
    allowNull: false,
    type: DataTypes.BIGINT,
    defaultValue: ACCOUNT_BALANCE_DEFAULT_VALUE
  }
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  modelName: 'accounts'
})


module.exports = Accounts;