const {Sequelize} = require('sequelize');
const CONFIG = require('./config');

console.log("ENV", CONFIG.NODE_ENV)

let sequelize;

if (CONFIG.NODE_ENV !== "production") {
  sequelize = new Sequelize(CONFIG.DATABASE_URL,{
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    sync: true,
    logging: false
  });
} else {  
  sequelize = new Sequelize(CONFIG.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    sync: true
  })
}







module.exports = sequelize;