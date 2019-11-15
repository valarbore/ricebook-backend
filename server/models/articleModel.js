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

let Article = mongoose.model('article', articleSchema);
export const Comment = mongoose.model('comment', articleSchema);
export default Article;
