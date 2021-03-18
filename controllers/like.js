'use strict';

const moment = require('moment');

// Model:
const Like = require('../models/like');

function addLike(req, res) {
    const userId = req.user.sub;
    const params = req.body;
    const likeId = params.publication;

    let like = new Like();
    like.user = userId;
    like.publication = likeId;
    like.created_at = moment().unix();

    like.save((err, likeStored) => {
        if (err) {
            return res.status(500).send({
                message: "[ERROR]: Petición de añadir un like"
            });
        }
        if (!likeStored) {
            return res.status(404).send({
                message: "[ERROR]: No se ha podido añadir el like"
            });
        }
        return res.status(200).send({
            like: likeStored
        });
    });
}

function deleteLike(req, res) {
    const userId = req.user.sub;
    const publicationId = req.params.id;

    Like.find({
        user: userId,
        publication: publicationId
    }).deleteMany((err) => {
        if (err) {
            return res.status(500).send({
                message: "[ERROR]: Petición de quitar el like de la publicación"
            });
        }
        return res.status(200).send({
            like: "Se ha quitado el like a la publicación " + publicationId
        });
    });
}

function getLikesUser(req, res) {
    let userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }

    const itemsPerPage = 5;
    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    Like.find({
        user: userId
    }).sort('-created_at')
        .populate({path: 'publication', populate: {path: 'user'}})
        .paginate(page, itemsPerPage, (err, likes, total) => {
            if (err) {
                return res.status(500).send({
                    message: "[ERROR]: Petición likes del usuario"
                });
            }
            if (!likes) {
                return res.status(404).send({
                    message: "[ERROR]: El usuario no tiene likes"
                });
            }
            return res.status(200).send({
                total: total,
                itemsPerPage: itemsPerPage,
                page: page,
                pages: Math.ceil(total / itemsPerPage),
                likes: likes
            });
        });
}

function getLikesPublication(req, res) {
    const publicationId = req.params.id;
    if (!req.params.id) {
        return res.status(404).send({
            message: "[ERROR]: No hay ninguna publicación"
        });
    }

    const itemsPerPage = 5;
    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    Like.find({
        publication: publicationId
    }).populate('user').paginate(page, itemsPerPage, (err, likes, total) => {
        if (err) {
            return res.status(500).send({
                message: "[ERROR]: Petición likes a la publicación"
            });
        }
        if (!likes) {
            return res.status(404).send({
                message: "[ERROR]: La publicación no tiene likes"
            });
        }
        return res.status(200).send({
            total: total,
            itemsPerPage: itemsPerPage,
            page: page,
            pages: Math.ceil(total/itemsPerPage),
            likes: likes
        });
    });
}

async function getCountLikesUser(req, res) {
    let userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    let number;
    try {
        number = await Like.countDocuments({
            user: userId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
    } catch (err) {
        console.log(err);
    }
    return res.status(200).send({
        numLikesUser: number
    });
}

async function getCountLikesPublication(req, res) {
    const publicationId = req.params.id;
    if (!req.params.id) {
        return res.status(404).send({
            message: "[ERROR]: No hay ninguna publicación"
        });
    }
    let number;
    try {
        number = await Like.countDocuments({
            publication: publicationId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
    } catch (err) {
        console.log(err);
    }
    return res.status(200).send({
        numLikesPublication: number
    });
}

function onlyLikesUser(req, res) {
    const userId = req.user.sub;
    onlyLikes(userId).then((value) => {
        return res.status(200).send({
            likes: value
        });
    });
}

async function onlyLikes(userId) {
    const resultado = await Like.find({
        user: userId
    }).select({
        '_id': 0, '__uv': 0, 'user': 0
    }).exec().then((likes) => {
        let follows_clean = [];
        likes.forEach((like) => {
            follows_clean.push(like.publication);
        });
        return follows_clean;
    }).catch((err) => {
        return handleError(err);
    });
    return resultado;
}

module.exports = {
    addLike,
    deleteLike,
    getLikesUser,
    getLikesPublication,
    getCountLikesUser,
    getCountLikesPublication,
    onlyLikesUser
}
