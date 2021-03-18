'use strict';

const mongoose = require('mongoose');
const schema = mongoose.Schema;

const likeSchema = schema({
    user: {type: schema.ObjectId, ref: 'User'},
    publication: {type: schema.ObjectId, ref: 'Publication'},
    created_at: String
});

module.exports = mongoose.model('Like', likeSchema);
