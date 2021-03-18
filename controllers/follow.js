'use strict';

// Models:
const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');

function followUser(req, res) {
    let params = req.body;
    let follow = new Follow();

    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición de seguimiento de usuario"
            });
        if (!followStored)
            return res.status(400).send({
                message: "[ERROR]: El seguimiento no se ha guardado"
            });
        return res.status(200).send({
            follow: followStored
        });
    });
}

function unfollowUser(req, res) {
    let userId = req.user.sub;
    let followId = req.params.id;

    Follow.find({
        'user': userId,
        'followed': followId
    }).remove((err) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición de quitar el seguimiento de usuario"
            });
        return res.status(200).send({
            message: "Se ha dejado de seguir al usuario " + followId
        });
    });
}

function getFollowingUsers(req, res) {
    let userId = req.user.sub;
    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    const itemsPerPage = 5;
    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    Follow.find({user: userId}).populate({path: 'followed'})
            .paginate(page, itemsPerPage, (err, follows, total) => {
                if (err)
                    return res.status(500).send({
                        message: "[ERROR]: Petición listado de seguidores"
                    });
                if (!follows)
                    return res.status(404).send({
                        message: "[ERROR]: El usuario no sigue a ningún usuario"
                    });
                followCount(req.user.sub).then((value) => {
                    return res.status(200).send({
                        total: total,
                        pages: Math.ceil(total / itemsPerPage),
                        follows,
                        following: value.following,
                        followed: value.followed
                    });
                });
            });
}

function getFollowedUsers(req, res) {
    let userId = req.user.sub;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    const itemsPerPage = 5;
    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    Follow.find({followed: userId}).populate('user').paginate(page,
            itemsPerPage, (err, follows, total) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición listado de seguidores"
            });
        if (!follows)
            return res.status(404).send({
                message: "[ERROR]: Al usuario no le sigue ningún usuario"
            });
        followCount(req.user.sub).then((value) => {
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total / itemsPerPage),
                follows,
                users_following: value.following,
                users_followed: value.followed
            });
        });
    });


}

async function followCount(userId) {
    let following = await Follow.find({
        'user': userId
    }).select({
        '_id': 0, '__uv': 0, 'user': 0
    }).exec().then((follows) => {
        let follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        return follows_clean;
    }).catch((err) => {
        return handleError(err);
    });
    let followed = await Follow.find({
        'followed': userId
    }).select({
        '_id': 0, '__uv': 0, 'followed': 0
    }).exec().then((follows) => {
        let follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.user);
        });
        return follows_clean;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        following: following,
        followed: followed
    };
}

function getOnlyFollowing(req, res) {
    const userId = req.user.sub;
    followingUser(userId).then((value) => {
        return res.status(200).send({
            following: value.following
        });
    });
}

async function followingUser(userId) {
    let following = await Follow.find({
        'user': userId
    }).select({
        '_id': 0, '__uv': 0, 'user': 0
    }).exec().then((follows) => {
        let follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        return follows_clean;
    }).catch((err) => {
        return handleError(err);
    });
    return {
        following: following
    };
}

module.exports = {
    followUser,
    unfollowUser,
    getFollowingUsers,
    getFollowedUsers,
    getOnlyFollowing
};


