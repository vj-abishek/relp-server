const mongoose = require('mongoose');

const { Schema } = mongoose;

const Token = new Schema({
  uid: String,
  token: String,
});

const token = mongoose.model('token', Token);
module.exports = token;
