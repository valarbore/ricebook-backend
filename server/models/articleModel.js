var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
  author: String,
  date: { type: Date, default: Date.now },
  text: String,
});

var articleSchema = new mongoose.Schema({
  author: String,
  avatar: String,
  img: String,
  date: { type: Date, default: Date.now },
  head: String,
  text: String,
  comments: [commentSchema],
});

exports.Article = mongoose.model('article', articleSchema);
exports.Comment = mongoose.model('comment', articleSchema);
