'use strict';

const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messageSchema = schema({
    text: String,
    viewed: String,
    created_at: String,
    emitter: {type: schema.ObjectId, ref: 'User'},
    receiver: {type: schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Message', messageSchema);
