const User = require('../models/userModel').User;
const Profile = require('../models/profileModel.js').Profile;
const {
  createRequestErrorResponse,
  createSuccessResponse,
  dbErrorResponse,
  parameterErrorResponse,
  noAuthorityResponse,
  userNotFoundErrorResponse,
} = require('../utils/resFormat');
const { encodePassword } = require('../utils/password');
const md5 = require('js-md5');

const userExistHint = 'You can not use a username already exists !';
const defaultStatus = 'new user!';
const passwordWrongHint = 'Password is wrong!';
const defaultAvatar =
  'https://res.cloudinary.com/hlfaynn4b/image/upload/v1574868400/3_uqbybj.jpg';

const cookieKey = 'sid';
const redis = require('redis').createClient(process.env.REDIS_URL);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const session = require('express-session');

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
          third: [],
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
        setSession(user, res);
        Profile.findById(user.pid, (err, profile) => {
          if (err) return dbErrorResponse(res, err);
          profile.set('third', user.third, { strict: false });
          return res.send(createSuccessResponse(profile));
        });
      }
    }
  });
};
const setSession = (user, res) => {
  const sessionKey = md5(user.username + new Date().getTime() + user.id);
  // set redis
  redis.set(sessionKey, JSON.stringify(user), 'EX', 3600);
  res.cookie(cookieKey, sessionKey, {
    maxAge: 3600 * 1000,
    httpOnly: true,
  });
};
/**
 * logout
 * clear cookie and redis
 * @param {*} req
 * @param {*} res success
 */
const logout = (req, res) => {
  try {
    const skey = req.cookies[cookieKey];
    // delete redis
    redis.del(skey);
    res.clearCookie(cookieKey);
    res.send(createSuccessResponse('success'));
  } catch (err) {
    console.log(err);
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
      profile.set('third', user.third, { strict: false });
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
  if (skey) {
    // get user from redis
    redis.get(skey, function(err, user) {
      if (err) return noAuthorityResponse(res);
      if (user) {
        req.user = JSON.parse(user);
        next();
      } else return noAuthorityResponse(res);
    });
  } else return noAuthorityResponse(res);
};

const unlinkThird = (req, res) => {
  const user = req.user;
  User.findById(user._id, function(err, user) {
    if (err) return dbErrorResponse(res, err);
    user.third.id(req.body._id).remove();
    user.save(user, (err, newUser) => {
      if (err) return dbErrorResponse(res, err);
      setSession(user, res);
      return res.send(createSuccessResponse(newUser.third));
    });
  });
};

passport.use(
  new GoogleStrategy(
    {
      clientID:
        '885541374521-nhb7n7j53dpprqdm0s3e7660u447i74g.apps.googleusercontent.com',
      clientSecret: '71zE_EjOhL91y4Bz0CXgerIN',
      callbackURL: 'http://localhost:8080/auth/google/callback',
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
      // User.findOrCreate({ googleId: profile.id }, function(err, user) {
      //   return cb(err, user);
      // });
    },
  ),
);
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ authId: id }).exec(function(err, user) {
    done(null, user);
  });
});
let isLoginOrLink = '';
let linkUser = '';
const checkLoginOrLink = (req, res, next) => {
  const strs = req.url.split('/');
  if (strs[1] === 'auth' && strs.length > 2 && strs[3] === 'google') {
    isLoginOrLink = strs[2];
    linkUser = strs.length === 5 ? strs[4] : '';
  }

  next();
};
const baseUrl = 'http://ricebook.bozhang.bz31.surge.sh';
const profileUrl = baseUrl + '/profile/';
const landingUrl = baseUrl + '/landing';
const homeUrl = baseUrl;
const googleLoginFailUrl = baseUrl + '/landing/googleFail/';
const googleLinkFailUrl = baseUrl + '/error/alreadyLinked';
const successFun = (req, res) => {
  const thirdProfile = req.user;
  // check whether user want to log in or link
  if (isLoginOrLink === 'login') {
    console.log('login');
    // use third party to login
    googleLogin(thirdProfile, res);
  } else {
    // link third party
    console.log('link');
    googleLink(thirdProfile, req, res);
  }
};

const googleLogin = (thirdProfile, res) => {
  // use third party to login
  // find linked user
  User.findOne(
    {
      'third.provider': thirdProfile.provider,
      'third.id': thirdProfile.id,
    },
    function(err, user) {
      if (err) return res.redirect(landingUrl);
      if (user) {
        setSession(user, res);
        return res.redirect(homeUrl);
      } else {
        // check whether displayName is used by other
        User.findOne({ username: thirdProfile.displayName }).exec(function(
          err,
          user,
        ) {
          if (err) return res.redirect(landingUrl);
          if (user) {
            // log in fail for the username used by other
            return res.redirect(googleLoginFailUrl + thirdProfile.displayName);
          } else {
            // not find then create a new account
            googleCreateUser(thirdProfile, res);
          }
        });
      }
    },
  );
};
const googleCreateUser = (thirdProfile, res) => {
  // not find then create a new account
  const [year, month, day] = ['1999', '09', '09'];
  const dobTime = new Date(year, parseInt(month) - 1, day).getTime();
  const newProfile = new Profile({
    username: thirdProfile.displayName,
    avatar: thirdProfile.photos[0].value,
    email: thirdProfile.emails[0].value,
    dob: dobTime,
    zipcode: '00000',
    headline: defaultStatus,
  });
  newProfile.save((err, profile) => {
    if (err) {
      return res.redirect(landingUrl);
    }
    const saltAndPass = encodePassword('123', null);
    const newUser = new User({
      username: thirdProfile.displayName,
      password: saltAndPass.encodedPass,
      salt: saltAndPass.salt,
      pid: profile.id,
      third: [{ provider: thirdProfile.provider, id: thirdProfile.id }],
    });
    newUser.save(err, user => {
      if (err) {
        return res.redirect(landingUrl);
      }
      setSession(user, res);
      return res.redirect(homeUrl);
    });
  });
};

const googleLink = (thirdProfile, req, res) => {
  // link third party

  // first check whether the third party is already linked by other user
  User.findOne(
    { 'third.provider': thirdProfile.provider, 'third.id': thirdProfile.id },
    (err, user) => {
      if (err) return res.redirect(profileUrl + linkUser);
      if (user) {
        console.log('already used');
        return res.redirect(googleLinkFailUrl);
      } else {
        // link third party with current user
        const skey = req.cookies[cookieKey];
        if (skey) {
          // get user from redis
          redis.get(skey, function(err, currentUser) {
            if (err) return res.redirect(profileUrl + linkUser);
            if (currentUser) {
              currentUser = JSON.parse(currentUser);
              User.findById(currentUser._id, function(err, user) {
                user.third.push({
                  provider: thirdProfile.provider,
                  id: thirdProfile.id,
                });
                user.save((err, newUser) => {
                  if (err) res.redirect(profileUrl + newUser.username);
                  setSession(newUser, res);
                  return res.redirect(profileUrl + newUser.username);
                });
              });
            } else return res.redirect(profileUrl + linkUser);
          });
        } else return res.redirect(profileUrl + linkUser);
      }
    },
  );
};

module.exports = app => {
  app.use(checkLoginOrLink);
  app.use(passport.initialize());
  app.use(
    '/auth/:type/google/:username?',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    }),
  );
  app.use(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: landingUrl }),
    successFun,
  );
  app.post('/register', register);
  app.post('/login', login);

  app.use(isLoggedIn);

  app.get('/auth', auth);
  app.put('/logout', logout);
  app.put('/unlink', unlinkThird);
};
