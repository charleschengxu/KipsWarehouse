const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const models = require('../../models');
var stage = process.env.stage || 'not_travis';

let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader()
};
if (stage == 'travis') {
  jwtOptions.secretOrKey = process.env.key;
} else {
  const config = require(__dirname + '/../../../config/authconfig.json');
  jwtOptions.secretOrKey = config.key;
}

const strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  next(null, {id: jwt_payload.id})
});

passport.use(strategy);

function generateJWT(userId, willNotExpire) {
  const payload = {id: userId};
  let options = {};
  if (!willNotExpire) { // token expires in 7 days.
    options.expiresIn = 60 * 60 * 24 * 7
  }
  const token = jwt.sign(payload, jwtOptions.secretOrKey, options);
  return token;
}

module.exports = {
  secret: jwtOptions.secretOrKey,
  passport: passport,
  generateJWT: generateJWT
}
