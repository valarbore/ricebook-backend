var mongoose = require('mongoose');

let ProfileSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  email: String,
  dob: Number,
  zipcode: String,
  headline: String,
  following: [String],
});

exports.Profile = mongoose.model('Profile', ProfileSchema);
