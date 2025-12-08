const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

class Customers extends Model {};

Customers.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull:true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull:false
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(value) {
      throw new Error('Do not try to set the `fullName` value!');
    }
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull:false
  },
  state: {
    type: DataTypes.STRING,
    allowNull:false
  },
  socialSecurity: {
    type: DataTypes.CHAR,
    unique: true,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING,
    allowNull:false
  },
  maritalStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  occupation: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  employer: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  identityCard: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.CHAR,
    allowNull: false,
    defaultValue: 'https://res.cloudinary.com/lordflames/image/upload/v1654516454/blank-profile-picture_dg8szo.png'
  }
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  modelName: 'customers'
})


module.exports = Customers;