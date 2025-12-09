const CONFIG = require("./config");

const allowedOrigins = [
  CONFIG.NATIONAL_WEBHOOK_URL,
  CONFIG.FRONTEND_URL
];

module.exports = allowedOrigins;