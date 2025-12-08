const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');


const pending = 'pending';
const completed = 'completed';
const failed = 'failed';

class InternalTransfers extends Model {};

InternalTransfers.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'accounts',
      key: 'id'
    }
  },
  receiverAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  trxnId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionStatus: {
    type: DataTypes.ENUM(pending, completed, failed),
    allowNull: false,
    defaultValue: pending
  },
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  modelName: 'internal_transfers',
  freezeTableName: true
})



module.exports = InternalTransfers;
