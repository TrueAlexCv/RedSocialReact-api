'use strict';

const express = require('express');
const api = express.Router();

// Middlewares:
const md_auth = require('../middlewares/authenticated');

// Controller:
const LikeController = require('../controllers/like');

api.post('/add-like', md_auth.ensureAuth, LikeController.addLike);
api.delete('/delete-like/:id', md_auth.ensureAuth, LikeController.deleteLike);
api.get('/likes-user/:id?/:page?', md_auth.ensureAuth, LikeController.getLikesUser);
api.get('/likes-publication/:id?/:page?', md_auth.ensureAuth, LikeController.getLikesPublication);
api.get('/num-likes-user/:id', md_auth.ensureAuth, LikeController.getCountLikesUser);
api.get('/num-likes-publication/:id', md_auth.ensureAuth, LikeController.getCountLikesPublication);
api.get('/only-likes', md_auth.ensureAuth, LikeController.onlyLikesUser);

module.exports = api;
