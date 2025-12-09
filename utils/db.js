const {Sequelize} = require('sequelize');
const pg = require("pg");
const CONFIG = require('./config');

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
    logging: false,
    dialectModule: pg
  });
} else {  
  sequelize = new Sequelize(CONFIG.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    sync: true
  })
}







module.exports = sequelize;