const User = require('../models/userModel').User;
const Profile = require('../models/profileModel.js').Profile;
const {
  dbErrorResponse,
  createSuccessResponse,
  parameterErrorResponse,
  createRequestErrorResponse,
  userNotFoundErrorResponse,
} = require('../utils/resFormat');

const assembleFollowing = (res, following) => {
  Profile.find({ username: { $in: following } }, (err, profiles) => {
    if (err) return dbErrorResponse(res, err);
    const followingInfo = profiles.map(profile => {
      return {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        headline: profile.headline,
      };
    });
    return res.send(createSuccessResponse(followingInfo));
  });
};
/**
 * get the list of users being followed by the requested user
 * @param {*} req
 * @param {*} res users being followed
 */
const getFollowing = (req, res) => {
  let username = req.params.user;
  if (username === undefined) username = req.user.username;
  Profile.findOne({ username: username }, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    if (!profile) return userNotFoundErrorResponse(res);
    return assembleFollowing(res, profile.following);
  });
};

/**
 * add :user to the following list for the logged in user
 * @param {*} req
 * @param {*} res
 */
const putFollowing = (req, res) => {
  const currentUser = req.user;
  const username = req.params.user;
  if (!username) return parameterErrorResponse(res);
  if (username === currentUser.username)
    return res
      .status(400)
      .send(createRequestErrorResponse('You can not follow yourself!'));
  // check whether the username exist
  User.findOne({ username: username }, (err, user) => {
    if (err) return dbErrorResponse(res, err);
    if (!user) return userNotFoundErrorResponse(res);
    else {
      Profile.findById(currentUser.pid, (err, profile) => {
        if (err) return dbErrorResponse(res, err);
        if (profile.following.includes(username))
          return res
            .status(400)
            .send(createRequestErrorResponse('You are following this user!'));
        profile.following.push(username);
        profile.save((err, newProfile) => {
          if (err) return dbErrorResponse(res, err);
          return assembleFollowing(res, newProfile.following);
        });
      });
    }
  });
};

/**
 * remove :user to the following list for the logged in user
 * @param {*} req
 * @param {*} res
 */
const deleteFollowing = (req, res) => {
  const currentUser = req.user;
  const username = req.params.user;
  if (!username) return parameterErrorResponse(res);
  Profile.findByIdAndUpdate(
    currentUser.pid,
    { $pull: { following: username } },
    { new: true, useFindAndModify: false },
    (err, profile) => {
      if (err) return dbErrorResponse(res, err);
      return assembleFollowing(res, profile.following);
    },
  );
};

module.exports = app => {
  app.get('/following/:user?', getFollowing);
  app.put('/following/:user', putFollowing);
  app.delete('/following/:user', deleteFollowing);
};
