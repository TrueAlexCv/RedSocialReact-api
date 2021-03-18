'use strict';

const jwt = require('jwt-simple');
const moment = require('moment');
const secret = 'true_alex_cv_europa';

exports.createToken = function(user) {
    let payload = {
        sub: user._id,
        email: user.email,
        nick: user.nick,
        name: user.name,
        image: user.image,
        banner: user.banner,
        biography: user.biography,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix
    };
    return jwt.encode(payload, secret);
};
