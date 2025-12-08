const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

class BasicInfo extends Model{}

BasicInfo.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    website: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'basic_info'
})

module.exports = BasicInfo;