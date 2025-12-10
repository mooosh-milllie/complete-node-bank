const CONFIG = require("./config");

const npb = CONFIG.NATIONAL_WEBHOOK_URL;
const fu = CONFIG.FRONTEND_URL;

console.log("ORIGINS", npb, fu);

const allowedOrigins = [
  fu,
  npb
];

module.exports = allowedOrigins;