var multiparty = require('multiparty');
var cloudinary = require('cloudinary');
const User = require('../models/userModel').User;
const Profile = require('../models/profileModel.js').Profile;
const Article = require('../models/articleModel').Article;
const {
  createRequestErrorResponse,
  dbErrorResponse,
  createSuccessResponse,
  parameterErrorResponse,
  cloudinaryErrorResponse,
  userNotFoundErrorResponse,
} = require('../utils/resFormat');
const { encodePassword } = require('../utils/password');

const userNotFound = 'Can not find this user';
/**
 * getHeadline
 * @param {*} req username
 * @param {*} res headline
 */
const getHeadline = (req, res) => {
  const username = req.params.user;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (profile) return res.send(createSuccessResponse(profile.headline));
    else return res.send(createRequestErrorResponse(userNotFound));
  });
};
/**
 * put headline
 * @param {*} req new headline
 * @param {*} res new headline
 */
const putHeadline = (req, res) => {
  const currentUser = req.user;
  const headline = req.body.headline;
  if (!headline) return parameterErrorResponse(res);
  Profile.findByIdAndUpdate(
    currentUser.pid,
    { headline: headline },
    { new: true, useFindAndModify: false },
    (err, profile) => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse(profile.headline));
    },
  );
};

/**
 * get the email address for the requested user
 * @param {*} req
 * @param {*} res
 */
const getEmail = (req, res) => {
  let username = req.params.user;
  if (username === undefined) username = req.user.username;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (!profile) return userNotFoundErrorResponse(res);
    return res.send(createSuccessResponse(profile.email));
  });
};
/**
 * update the email addres for the logged in user
 * @param {*} req
 * @param {*} res
 */
const putEmail = (req, res) => {
  const user = req.user;
  const email = req.body.email;
  if (!email) return parameterErrorResponse(res);
  Profile.findOneAndUpdate(
    { username: user.username },
    { $set: { email: email } },
    { new: true, useFindAndModify: false },
    (err, profile) => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse(profile.email));
    },
  );
};
/**
 * get the zipcode for the requested user
 * @param {*} req
 * @param {*} res
 */
const getZipcode = (req, res) => {
  let username = req.params.user;
  if (username === undefined) username = req.user.username;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (!profile) return userNotFoundErrorResponse(res);
    return res.send(createSuccessResponse(profile.zipcode));
  });
};
/**
 * update the zipcode for the logged in user
 * @param {*} req
 * @param {*} res
 */
const putZipcode = (req, res) => {
  const user = req.user;
  const zipcode = req.body.zipcode;
  if (!zipcode) return parameterErrorResponse(res);
  Profile.findOneAndUpdate(
    { username: user.username },
    { $set: { zipcode: zipcode } },
    { new: true, useFindAndModify: false },
    (err, profile) => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse(profile.zipcode));
    },
  );
};
/**
 * get the date of birth in milliseconds for the requested user
 * @param {*} req
 * @param {*} res
 */
const getDob = (req, res) => {
  let username = req.params.user;
  if (username === undefined) username = req.user.username;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (!profile) return userNotFoundErrorResponse(res);
    return res.send(createSuccessResponse(profile.dob));
  });
};
/**
 * get the avatar for the requested user
 * @param {*} req
 * @param {*} res
 */
const getAvatar = (req, res) => {
  let username = req.params.user;
  if (username === undefined) username = req.user.username;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (!profile) return userNotFoundErrorResponse(res);
    return res.send(createSuccessResponse(profile.avatar));
  });
};

/**
 * upload a new avatar
 * @param {*} req avatar file, profile id
 * @param {*} res new profile
 */
const putAvatar = (req, res) => {
  const user = req.user;
  // parse a file upload
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    if (!files) return parameterErrorResponse(res);
    if (!files.avatar) return parameterErrorResponse(res);
    // upload file to cloudinary
    try {
      cloudinary.uploader.upload(files.avatar[0].path, function(result) {
        // upload success update avatar url to db and return new profile
        Article.updateMany(
          { author: user.username },
          { $set: { avatar: result.url } },
          err => {
            if (err) return dbErrorResponse(res, err);
            Profile.findByIdAndUpdate(
              user.pid,
              { $set: { avatar: result.url, updateDate: new Date() } },
              { new: true, useFindAndModify: false },
              (err, profile) => {
                if (err) return dbErrorResponse(res, err);
                return res.send(createSuccessResponse(profile.avatar));
              },
            );
          },
        );
      });
    } catch (err) {
      // upload to cloudinary fail
      return cloudinaryErrorResponse(res, err);
    }
  });
};
/**
 * Changes the password for the logged in user.
 * @param {*} req
 * @param {*} res
 */
const putPassword = (req, res) => {
  const password = req.body.password;
  const user = req.user;
  if (!password) return parameterErrorResponse(res);
  const saltAndPass = encodePassword(password, null);
  User.findOneAndUpdate(
    { username: user.username },
    { $set: { password: saltAndPass.encodedPass, salt: saltAndPass.salt } },
    err => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse('success!'));
    },
  );
};

module.exports = app => {
  app.get('/headline/:user', getHeadline);
  app.put('/headline', putHeadline);
  app.get('/email/:user?', getEmail);
  app.put('/email', putEmail);
  app.get('/zipcode/:user?', getZipcode);
  app.put('/zipcode', putZipcode);
  app.get('/dob/:user?', getDob);
  app.get('/avatar/:user?', getAvatar);
  app.put('/avatar', putAvatar);
  app.put('/password', putPassword);
};
