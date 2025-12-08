const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

const debit = 'debit';
const credit = 'credit';

const pending = 'pending';
const completed = 'completed';
const failed = 'failed';

class LocalTransfer extends Model {}

LocalTransfer.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'accounts',
      key: 'id'
    }
  },
  entry: {
    type: DataTypes.ENUM(debit, credit),
    allowNull: false
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  routingNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  accountNumber: {
    type:DataTypes.BIGINT,
    allowNull: false,
  },
  accountName: {
    type:DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(pending, completed, failed),
    allowNull: false
  },
  trxnId: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  sequelize,
  modelName: 'local_transfers',
  underscored: true,
  timestamps: true,
  freezeTableName: true
});

module.exports = LocalTransfer;