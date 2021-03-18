'use strict';

const express = require('express');
const api = express.Router();
const multiparty = require('connect-multiparty');

// Middlewares:
const md_auth = require('../middlewares/authenticated');
const md_upload = multiparty({uploadDir: './uploads/publications'});

// Controller:
const PublicationController = require('../controllers/publication');

api.post('/publication', md_auth.ensureAuth,
        PublicationController.makePublication);
api.delete('/publication/:id', md_auth.ensureAuth,
        PublicationController.deletePublication);
api.get('/publication/:id', md_auth.ensureAuth,
        PublicationController.getPublication);
api.get('/publications/:user?/:page?', md_auth.ensureAuth,
        PublicationController.getPublicationsUser);
api.get('/timeline/:page?', md_auth.ensureAuth, PublicationController.getTimeline);
api.post('/publication-image/:id', [md_auth.ensureAuth, md_upload],
        PublicationController.uploadImage);
api.get('/publication-image/:image',
        PublicationController.getImage);

module.exports = api;