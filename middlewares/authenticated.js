'use strict';

const jwt = require('jwt-simple');
const moment = require('moment');
const secret = 'true_alex_cv_europa';

exports.ensureAuth = function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({
            message: "[ERROR]: La petición no tiene cabezera de autentificación"
        });
    }

    let token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        var payload = jwt.decode(token, secret);
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                message: "[ERROR]: El token ha expirado"
            });
        }
        req.user = payload;
        next();
    } catch (ex) {
        return res.status(401).send({
            message: "[ERROR]: El token no es válido"
        });
    }
};