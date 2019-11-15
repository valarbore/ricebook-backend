import Profile from '../models/profileModel';
import Article from '../models/articleModel';
const ObjectId = require('mongoose').Types.ObjectId;
import {
  createDBErrorResponse,
  createSuccessResponse,
  cloudinaryErrorResponse,
  dbErrorResponse,
  noAuthorityResponse,
  createRequestErrorResponse,
} from '../utils/resFormat';
var multiparty = require('multiparty');
var cloudinary = require('cloudinary');

/**
 * assemble article
 * @param {*} img img url
 * @param {*} user current user
 * @param {*} fields head text
 * @param {*} res response
 */
const assembleArticle = (img, user, fields, res) => {
  Profile.findById(user.pid, (err, profile) => {
    if (err) return dbErrorResponse(res, err);
    const newArticle = new Article({
      author: profile.username,
      avatar: profile.avatar,
      img: img,
      head: fields.head[0] || '',
      text: fields.text[0] || '',
      comments: [],
    });
    newArticle.save((err, article) => {
      if (err) {
        return res.send(createDBErrorResponse());
      }
      return res.send(createSuccessResponse(article));
    });
  });
};
/**
 * postArticle
 * @param {*} req head,text,img(optional)
 * @param {*} res new article
 */
const postArticle = (req, res) => {
  const user = req.user;
  // parse a file upload
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    if (files.img === undefined) {
      assembleArticle(null, user, fields, res);
    } else {
      // upload file to cloudinary
      try {
        cloudinary.uploader.upload(files.img[0].path, function(result) {
          assembleArticle(result.url, user, fields, res);
        });
      } catch (err) {
        // upload to cloudinary fail
        return cloudinaryErrorResponse(res);
      }
    }
  });
};
/**
 * getArticle
 * none
 * If specificed, :id is a post id or username
 * A requested article, all requested articles by a user,
 * or array of articles in the loggedInUser's feed
 * @param {*} req
 * @param {*} res
 */
const getArticle = (req, res) => {
  const user = req.user;
  const id = req.params.id;
  if (id === undefined) {
    // get articles by current user
    Profile.findById(user.pid, (err, profile) => {
      if (err) dbErrorResponse(res, err);
      const following = profile.following;
      const authors = [user.username].concat(following);
      Article.find({ author: { $in: authors } })
        .sort({ date: -1 })
        .exec((err, articles) => {
          if (err) return dbErrorResponse(res, err);
          return res.send(createSuccessResponse(articles));
        });
    });
  } else {
    // get by post id
    try {
      Article.findById(ObjectId(id))
        .sort({ date: -1 })
        .exec((err, article) => {
          if (err) dbErrorResponse(res, err);
          if (article) return res.send(createSuccessResponse(article));
        });
    } catch (err) {
      // get by author name
      Article.find({ author: id })
        .sort({ date: -1 })
        .exec((err, articles) => {
          if (err) return dbErrorResponse(res, err);
          return res.send(createSuccessResponse(articles));
        });
    }
  }
};

const putArticle = (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const commentId = req.body.commentId;
  Article.findById(id, (err, article) => {
    if (err) return dbErrorResponse(res, err);
    if (!article)
      return res
        .status(400)
        .send(createRequestErrorResponse('Can not find this article'));
    if (commentId === undefined) {
      // update article by id
      // make sure current user has authority to update it
      if (article.author !== user.username) {
        // no authority
        return noAuthorityResponse(res);
      } else {
        // has authority
        Article.findByIdAndUpdate(
          id,
          { $set: { head: req.body.head, text: req.body.text } },
          { new: true },
          (err, newArticle) => {
            if (err) return dbErrorResponse(res, err);
            return res.send(createSuccessResponse(newArticle));
          },
        );
      }
    } else {
      const comment = {
        author: user.username,
        text: req.body.text,
      };
      if (commentId === -1) {
        // create a new comment to the article
        article.comments.push(comment);
      } else {
        // update a comment by commentId
        var currentComment = article.comments.id(commentId);
        // make sure current user has authority to change the comment
        if (currentComment.author === user.username) {
          // has authority
          article.comments.id(commentId).remove();
          article.comments.push(comment);
        } else noAuthorityResponse(res);
      }
      // return the new article
      article.save(article, (err, newArticle) => {
        if (err) dbErrorResponse(res, err);
        return res.send(createSuccessResponse(newArticle));
      });
    }
  });
};

module.exports = { postArticle, getArticle, putArticle };
