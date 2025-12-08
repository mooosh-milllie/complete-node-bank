const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

class PendingTransactions extends Model{};


PendingTransactions.init({
  id: {
    type: DataTypes.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  transferType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bankIdentityNumber: {
    type: DataTypes.CHAR
  },
  description: {
    type: DataTypes.STRING,
    allowNull:true
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderOrReceiver: {
    type: DataTypes.CHAR,
  },
  institution: {
    type: DataTypes.STRING
  },
  credit: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  debit: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  balance: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  address: {
    type: DataTypes.CHAR
  },
  schedule: {
    type: DataTypes.DATE,
  },
  transactionStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }

}, {
  sequelize,
  underscored: true,
  timestamps: true,
  modelName: 'pending_transaction',
  freezeTableName: true
})

module.exports = PendingTransactions;