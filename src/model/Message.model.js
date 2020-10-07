const mongoose = require('mongoose');

const { Schema } = mongoose;

const Message = new Schema({
    to: String,
    body: String,
    channel: String,
});

const message = mongoose.model('message', Message);
module.exports = message;