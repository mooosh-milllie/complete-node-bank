const router = require('express').Router();
const JWT = require('jsonwebtoken');
const CONFIG = require('../utils/config');
const { Login }= require('../models/index');
const { setSessionLimitCookie } = require('../utils/setAllCookieLimit');


router.get('/', async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(403);
  const refreshToken = cookies.jwt;
  
  const existingToken = await Login.findOne({ where:{ refreshToken }});

  if (!existingToken) return res.sendStatus(403); //Forbidden
  // evaluate JWT
  JWT.verify(
    refreshToken,
    CONFIG.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if (err || existingToken.username !== decoded.user) return res.sendStatus(403);
      const role = Object.values(JSON.parse(existingToken.role));

      const userToken = {
        user: existingToken.username,
        id: existingToken.id,
        refId: existingToken.customerId,
        role: role
      }
      const accessToken = JWT.sign(
        userToken,
        CONFIG.ACCESS_TOKEN_SECRET,
        { expiresIn: CONFIG.ACCESS_TOKEN_EXPIRES }
      );
      setSessionLimitCookie(res);
      res.json({ accessToken })
    }
  );
})

module.exports = router;