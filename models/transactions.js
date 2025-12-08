const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

const local = 'local';
const internal = 'internal';
const cardDebit = 'card_debit';
const withdrawal = 'withdrawal';
const internationalWire = 'international_wire';
const localWire = 'local_wire';
const billPayment   = "bill_payment";

const debit = 'debit';
const credit = 'credit';


class Transactions extends Model{}

Transactions.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    transactionType: {
        type: DataTypes.ENUM(local, internal, cardDebit, withdrawal, internationalWire, localWire, billPayment),
        allowNull: false,
    },
    accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'accounts',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    entry: {
        type: DataTypes.ENUM(debit, credit),
        allowNull: false
    },
    charge: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    balance: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    trxnId: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'transactions'
})

module.exports = Transactions;