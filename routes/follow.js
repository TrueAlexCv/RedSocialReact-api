'use strict';

const express = require('express');
const api = express.Router();

// Middlewares:
const md_auth = require('../middlewares/authenticated');

// Controller:
const FollowController = require('../controllers/follow');

api.post('/follow', md_auth.ensureAuth, FollowController.followUser);
api.delete('/unfollow/:id', md_auth.ensureAuth, FollowController.unfollowUser);
api.get('/following/:id?/:page?', md_auth.ensureAuth,
        FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth,
        FollowController.getFollowedUsers);
api.get('/only-following', md_auth.ensureAuth,
        FollowController.getOnlyFollowing);

module.exports = api;

