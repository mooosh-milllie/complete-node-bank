const JWT = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Login } = require('../models/index');
const CONFIG = require('../utils/config');
const { setSessionLimitCookie } = require('../utils/setAllCookieLimit');
// const {logoutHelper} = require('../helpers/logoutHelper')

const sseAuth = async(req, res, next) => {
  const {token: authorization} = req.query;
  
  if (authorization) {
    JWT.verify(
      authorization,
      CONFIG.ACCESS_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {console.log(err); return res.sendStatus(403)}
        const loggedIn = await Login.findOne({
          where: {
            id: decoded.id,
            refreshToken: {
              [Op.ne]: null
            }
          }
        })

        if (!loggedIn) {
          return res.status(403).send({success: false, message: 'LOGGED OUT'});
        }
        // setSessionLimitCookie(res);
        req.id = decoded.id;
        req.refId = decoded.refId;
        req.username = decoded.username;
        req.roles = decoded.role;
        next();
      }
    )
    return;
  }
  res.sendStatus(401);
}

module.exports = sseAuth;