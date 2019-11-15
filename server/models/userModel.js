var mongoose = require('mongoose');

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  salt: String,
  pid: String,
});

exports.User = mongoose.model('User', UserSchema);
