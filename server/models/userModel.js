var mongoose = require('mongoose');

let ThridSchema = new mongoose.Schema({
  provider: String,
  id: String,
});

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  salt: String,
  pid: String,
  third: [ThridSchema],
});

exports.User = mongoose.model('User', UserSchema);
