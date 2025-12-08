const Customers = require('./customer');
const Login = require('./login');
const Accounts = require("./accounts");
const sequelize = require('../utils/db')
const InternalTransfers = require('./internalTransfers');
const LocalTransfers = require('./localTransfers');
const Transactions = require('./transactions');
const BasicInfo = require('./basicInfo')
const PendingTransactions = require('./pendingTransactions');

const Admin = require('./admin');
const AdminCustomerHistory = require('./adminCustomerHistory');
const {DataTypes} = require('sequelize');
const CustomerLoginInfo = require('./customerLoginInfo');

Customers.hasOne(Login, {
  onDelete: 'CASCADE'
});
Login.belongsTo(Customers, {
  onDelete: 'CASCADE',
  foreignKey: {
    name: 'customer_id',
    allowNull: false
  }
})

Customers.hasOne(Accounts, {
  onDelete: 'CASCADE'
})

Accounts.belongsTo(Customers, {
  onDelete: 'CASCADE',
  foreignKey: {
    name: 'customer_id',
    allowNull: false,
  }
})

Customers.hasMany(PendingTransactions, {
  onDelete: 'CASCADE',
});
PendingTransactions.belongsTo(Customers, {
  onDelete: 'CASCADE',
  foreignKey: {
    name: 'customer_id',
    allowNull: false
  }
});

Accounts.hasMany(InternalTransfers, {
  onDelete: 'CASCADE'
})

InternalTransfers.belongsTo(Accounts, {
  onDelete: 'CASCADE'
})

Accounts.hasMany(LocalTransfers, {
  onDelete: 'CASCADE'
})

LocalTransfers.belongsTo(Accounts, {
  onDelete: 'CASCADE'
})

Accounts.hasMany(Transactions, {
  onDelete: 'CASCADE'
})

Transactions.belongsTo(Accounts, {
  onDelete: 'CASCADE'
})

Login.hasMany(CustomerLoginInfo, {
  onDelete: 'CASCADE',
});
CustomerLoginInfo.belongsTo(Login, {
  onDelete: 'CASCADE',
});

// LocalTransfers.sync({force: true});

// Transactions.sync({force: true});
// InternalTransfers.sync();
// Accounts.sync();

// CustomerLoginInfo.sync({force: true});

// async function syncModels() {
//   try {
//     // await Login.sync({force: true});
//     // await CustomerLoginInfo.sync({force: true});
//     console.log(await CustomerLoginInfo.create({
//       ipAddress: '197.210.226.66',
//       city: 'Port Harcourt',
//       country: 'NG',
//       region: 'RI',
//       ll: [ 4.7774, 7.0134 ],
//       deviceType: 'Desktop'
//     }))
//   } catch (error) {
//     console.log(error)
//   }
  
// }
// syncModels();

// sequelize.sync({force: true}) // Use force: true to drop existing tables
//   .then(() => {
//     console.log('Tables created successfully!');
//   })
//   .catch((err) => {
//     console.error('Error creating tables:', err);
//   });


// Login.sync({force: true})
// CustomerLoginInfo.sync({force: true})
// AccountHistory.sync({force: true})

// async function www(params) {
//   await Customers.sync({force: true})
//   console.log("customers created")

//   await PendingTransactions.sync({force: true});

//   console.log("pending transactions created")
  
// }
// www()

// async function uc() {
//   console.log("I started");
//   await Accounts.update({
//     availableBalance: 5000000,
//     currentBalance: 5000000
//   },
//   {where: {
//     customer_id: 'ac0e56c3-c4ba-4aeb-8a65-c420736a4c78'
//   }}
//   )
//   console.log("I finished");
// }
// uc();
// Admin.belongsToMany(Customers, {through: AdminCustomerHistory});
// Customers.belongsToMany(Admin, {
//   through: AdminCustomerHistory
// })
// Admin.sync({force: true})

module.exports = {
  Customers, Login, Accounts, PendingTransactions, CustomerLoginInfo, BasicInfo, Transactions
}