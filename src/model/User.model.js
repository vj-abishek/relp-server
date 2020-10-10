const mongoose = require('mongoose');

const { Schema } = mongoose;

const User = new Schema({
  uid: String,
  LastSeen: Number,
  status: String,
});

const user = mongoose.model('user', User);
module.exports = user;
