'use strict';

const path = require('path');
const fs = require('fs');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');

// Models:
const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');
const Like = require('../models/like');

function makePublication(req, res) {
    let params = req.body;
    if (!params.text) {
        return res.status(200).send({
            message: "[ERROR] Debes incluir un texto"
        });
    }

    let publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición para realizar una publicación"
            });
        if (!publicationStored) {
            return res.status(404).send({
                message: "[ERROR]: La publicación no se ha realizado"
            });
        }
        return res.status(200).send({
            publication: publicationStored
        });
    });
}

function deletePublication(req, res) {
    let publicationId = req.params.id;

    Like.find({
        publication: publicationId
    }).deleteMany((err) => {
        if (err) {
            return res.status(500).send({
                message: "[ERROR]: Petición de quitar los likes a la publicación eliminada"
            });
        }
        Publication.find({
            'user': req.user.sub, '_id': publicationId
        }).remove((err, publicationRemoved) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición de eliminar la publicación"
                });
            if (!publicationRemoved)
                return res.status(404).send({
                    message: "[ERROR]: No se ha borrado la publicación"
                });
            return res.status(200).send({
                publication: publicationRemoved
            });
        });
    });
}

function getPublication(req, res) {
    let publicationId = req.params.id;

    Publication.findOne({
        _id: publicationId
    }).populate('user').exec((err, publication) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición de buscar la publicación"
            });
        if (!publication)
            return res.status(404).send({
                message: "[ERROR]: No se encuentra dicha publicación"
            });
        return res.status(200).send({
            publication: publication
        });
    });
}

function getPublicationsUser(req, res) {
    let user = req.user.sub;
    if (req.params.user) {
        user = req.params.user;
    }

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    const itemsPerPage = 5;

    Publication.find({
        user: user
    }).sort('-created_at').populate('user')
        .paginate(page, itemsPerPage, (err, publications, total) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición de las publicaciones " +
                        "del usuario"
                });
            if (!publications)
                return res.status(404).send({
                    message: "[ERROR]: El usuario no tiene publicaciones"
                });
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications
            });
        });
}

function getTimeline(req, res) {
    const userId = req.user.sub;
    const itemsPerPage = 5;

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    Follow.find({
        user: userId
    }).populate('followed').exec((err, follows) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición del timeline del usuario"
            });
        if (!follows)
            return res.status(404).send({
                message: "[ERROR]: El usuario no sigue a nadie"
            });
        let follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        follows_clean.push(userId);

        Publication.find({
            user: { "$in": follows_clean }
        }).sort('-created_at').populate('user')
            .paginate(page, itemsPerPage, (err, publications, total) => {
                if (err)
                    return res.status(500).send({
                        message: "[ERROR]: Petición al devolver las " +
                            "publicaciones"
                    });
                if (!publications)
                    return res.status(404).send({
                        message: "[ERROR]: Los usuarios no tienen " +
                            "publicaciones"
                    });
                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total / itemsPerPage),
                    page: page,
                    items_per_page: itemsPerPage,
                    publications
                });
            });
    });
}

function uploadImage(req, res) {
    let publicationId = req.params.id;

    if (req.files) {
        let file_path = req.files.image.path;
        console.log(file_path);
        let file_split = file_path.split('\\');
        let file_name = file_split[2];
        let exp_split = file_name.split('\.');
        let file_ext = exp_split[1];

        if (file_ext === 'png' || file_ext === 'jpg' ||
            file_ext === 'jpeg' || file_ext === 'gif') {
            Publication.findOne({
                'user': req.user.sub,
                '_id': publicationId
            }).exec((err, publication) => {
                if (publication) {
                    Publication.findByIdAndUpdate(publicationId,
                        { file: file_name }, { new: true },
                        (err, publicationUpdated) => {
                            if (err)
                                return res.status(500).send({
                                    message: "[ERROR]: Petición " +
                                        "actualizar imagen de la publicación"
                                });
                            if (!publicationUpdated)
                                return res.status(404).send({
                                    message: "[ERROR]: No se actualizó la " +
                                        "imagen de la publicación"
                                });
                            return res.status(200).send({
                                user: publicationUpdated
                            });
                        });
                } else {
                    return fs.unlink(file_path, (err) => {
                        res.status(404).send({
                            message: "[ERROR]: No tienes permisos para " +
                                "actualizar la imagen de esta publicación"
                        });
                    });
                }
            });
        } else {
            return fs.unlink(file_path, (err) => {
                res.status(404).send({
                    message: "[ERROR]: Extensión de imagen incorrecta"
                });
            });
        }
    }
}

function getImage(req, res) {
    let image = req.params.image;
    let path_file = './uploads/publications/' + image;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({
                message: "[ERROR]: No se localiza la imagen"
            });
        }
    });
}

module.exports = {
    makePublication,
    deletePublication,
    getPublication,
    getPublicationsUser,
    getTimeline,
    uploadImage,
    getImage
};
