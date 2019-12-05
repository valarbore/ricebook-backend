const Profile = require('../models/profileModel.js').Profile;
const Article = require('../models/articleModel').Article;
const ObjectId = require('mongoose').Types.ObjectId;
const {
  createDBErrorResponse,
  createSuccessResponse,
  cloudinaryErrorResponse,
  dbErrorResponse,
  noAuthorityResponse,
  createRequestErrorResponse,
} = require('../utils/resFormat');
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
        return cloudinaryErrorResponse(res, err);
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
        .limit(10)
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
        .limit(10)
        .sort({ date: -1 })
        .exec((err, articles) => {
          if (err) return dbErrorResponse(res, err);
          return res.send(createSuccessResponse(articles));
        });
    }
  }
};

const updateArticle = (id, fields, res, img) => {
  Article.findByIdAndUpdate(
    id,
    {
      $set: {
        head: fields.head ? fields.head[0] : '',
        text: fields.text ? fields.text[0] : '',
        img: img,
      },
    },
    { new: true, useFindAndModify: false },
    (err, newArticle) => {
      if (err) return dbErrorResponse(res, err);
      return res.send(createSuccessResponse(newArticle));
    },
  );
};
/**
 * update article
 * no commentId: update article content
 * has commentId: commentId = -1 add new comment
 * commentId!=-1 update comment with commentId
 * @param {*} req
 * @param {*} res
 */
const putArticle = (req, res) => {
  const user = req.user;
  const id = req.params.id;

  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    const commentId = fields.commentId ? fields.commentId[0] : undefined;
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
          console.log(fields);
          console.log(files);
          if (files.img === undefined) {
            updateArticle(id, fields, res, null);
          } else {
            // upload file to cloudinary
            try {
              cloudinary.uploader.upload(files.img[0].path, function(result) {
                updateArticle(id, fields, res, result.url);
              });
            } catch (err) {
              // upload to cloudinary fail
              return cloudinaryErrorResponse(res, err);
            }
          }
        }
      } else {
        const comment = {
          author: user.username,
          text: fields.text ? fields.text[0] : '',
        };
        if (commentId === '-1') {
          // create a new comment to the article
          article.comments.push(comment);
        } else {
          // update a comment by commentId
          var currentComment = article.comments.id(commentId);
          // make sure current user has authority to change the comment
          if (currentComment && currentComment.author === user.username) {
            // has authority
            article.comments.id(commentId).text = comment.text;
          } else noAuthorityResponse(res);
        }
        // return the new article
        article.save(article, (err, newArticle) => {
          if (err) dbErrorResponse(res, err);
          return res.send(createSuccessResponse(newArticle));
        });
      }
    });
  });
};

module.exports = app => {
  app.post('/article', postArticle);
  app.get('/article/:id?', getArticle);
  app.put('/article/:id', putArticle);
};
