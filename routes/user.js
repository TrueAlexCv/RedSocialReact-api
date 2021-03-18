'use strict';

const express = require('express');
const api = express.Router();
const multiparty = require('connect-multiparty');

// Middlewares:
const md_auth = require('../middlewares/authenticated');
const md_upload_image = multiparty({uploadDir: './uploads/users'});
const md_upload_banner = multiparty({uploadDir: './uploads/banners'});

// Controller:
const UserController = require('../controllers/user');

api.post('/register', UserController.registerUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/update-profile/:id', md_auth.ensureAuth,
    UserController.updateProfile);
api.post('/upload-image/:id', [md_auth.ensureAuth, md_upload_image],
    UserController.uploadImage);
api.post('/upload-banner/:id', [md_auth.ensureAuth, md_upload_banner],
    UserController.uploadBanner);
api.get('/getImage/:image', UserController.getImage);
api.get('/getBanner/:banner', UserController.getBanner);
api.post('/update-password', md_auth.ensureAuth, UserController.updatePassword);
api.post('/search-users/:page?', UserController.searchUsers);

module.exports = api;

