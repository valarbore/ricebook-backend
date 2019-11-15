import User from '../models/userModel';
import Profile from '../models/profileModel';
import {
  createRequestErrorResponse,
  createSuccessResponse,
  dbErrorResponse,
  parameterErrorResponse,
  noAuthorityResponse,
  userNotFoundErrorResponse,
} from '../utils/resFormat';
import encodePassword from '../utils/password';
import md5 from 'js-md5';

const userExistHint = 'You can not use a username already exists !';
const defaultStatus = 'new user!';
const passwordWrongHint = 'Password is wrong!';
const defaultAvatar =
  'https://res.cloudinary.com/hggmoxqaq/image/upload/v1573786144/2_cnv0na.jpg';

const sessionUser = {};
const cookieKey = 'sid';

/**
 * register
 * @param {*} req register info
 * @param {*} res user info
 */
const register = (req, res) => {
  const username = req.body.username;
  User.findOne({ username: username }, function(err, user) {
    if (err) {
      return dbErrorResponse(res, err);
    }
    if (user === null) {
      const username = req.body.username;
      const email = req.body.email;
      const dob = req.body.dob;
      const zipcode = req.body.zipcode;
      const password = req.body.password;
      if (!username || !email || !dob || !zipcode || !password) {
        return parameterErrorResponse(res);
      }
      const [year, month, day] = dob.split('-');
      const dobTime = new Date(year, parseInt(month) - 1, day).getTime();
      const saltAndPass = encodePassword(password, null);
      const newProfile = new Profile({
        username: username,
        avatar: defaultAvatar,
        email: email,
        dob: dobTime,
        zipcode: zipcode,
        headline: defaultStatus,
      });
      newProfile.save((err, profile) => {
        if (err) {
          return dbErrorResponse(res, err);
        }
        const newUser = new User({
          username: username,
          password: saltAndPass.encodedPass,
          salt: saltAndPass.salt,
          pid: profile.id,
        });
        newUser.save(err => {
          if (err) {
            return dbErrorResponse(res, err);
          }
          return res.send(createSuccessResponse(profile));
        });
      });
    } else {
      return res.status(403).send(createRequestErrorResponse(userExistHint));
    }
  });
};

/**
 * login
 * @param {*} req username password
 * @param {*} res user info
 */
const login = (req, res) => {
  if (!req.body.username || !req.body.password)
    return parameterErrorResponse(res);
  //test username and password
  User.findOne({ username: req.body.username }, (err, user) => {
    if (err) return dbErrorResponse(res, err);
    if (!user) {
      // can not find username
      return userNotFoundErrorResponse(res);
    } else {
      const encodedPass = encodePassword(req.body.password, user.salt)
        .encodedPass;
      if (encodedPass !== user.password) {
        // password wrong
        return res.send(createRequestErrorResponse(passwordWrongHint));
      } else {
        // login success
        // set session and cookie, later used to authenticate user
        const sessionKey = md5(user.salt + new Date().getTime() + user.id);
        sessionUser[sessionKey] = user;
        res.cookie(cookieKey, sessionKey, {
          maxAge: 3600 * 1000,
          httpOnly: true,
        });
        Profile.findById(user.pid, (err, profile) => {
          if (err) return dbErrorResponse(res, err);
          return res.send(createSuccessResponse(profile));
        });
      }
    }
  });
};
/**
 * logout
 * clear cookie and sessionUser
 * @param {*} req
 * @param {*} res success
 */
const logout = (req, res) => {
  try {
    const skey = req.cookies[cookieKey];
    delete sessionUser[skey];
    res.clearCookie(cookieKey);
    res.send(createSuccessResponse('success'));
  } catch (err) {
    res.send(createRequestErrorResponse('logout fail!'));
  }
};
/**
 * auth check whether user logged in
 * @param {*} req
 * @param {*} res return user info
 */
const auth = (req, res) => {
  const user = req.user;
  if (user) {
    Profile.findById(user.pid, (err, profile) => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse(profile));
    });
  } else return noAuthorityResponse(res);
};

/**
 * middleware check whether user is logged in
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const isLoggedIn = (req, res, next) => {
  const skey = req.cookies[cookieKey];
  const user = sessionUser[skey];
  console.log(req.url);
  if (req.url === '/login' || req.url === '/register') next();
  else {
    if (user) {
      req.user = user;
      next();
    } else return noAuthorityResponse(res);
  }
};

module.exports = {
  register,
  login,
  auth,
  isLoggedIn,
  sessionUser,
  cookieKey,
  logout,
};
