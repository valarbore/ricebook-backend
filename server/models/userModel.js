var mongoose = require('mongoose');

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  salt: String,
  pid: String,
});

let User = mongoose.model('User', UserSchema);

export default User;
