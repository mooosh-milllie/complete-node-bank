const {Sequelize} = require('sequelize');
const CONFIG = require('./config');

console.log(CONFIG.DB_USER, CONFIG.PASSWORD);


const sequelize = new Sequelize(CONFIG.DATABASE, CONFIG.DB_USER, CONFIG.PASSWORD, {
  host: CONFIG.HOST,
  database: CONFIG.DATABASE,
  port: CONFIG.DATABASE_PORT,
  dialect: 'postgres',
  logging: false,
  sync: true
})

// const sequelize = new Sequelize(CONFIG.DATABASE_URL,{
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   }
// });




module.exports = sequelize;