'use strict';

const bcrypt = require('bcrypt');
const mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

// Models:
const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');
const Like = require('../models/like');

// Services:
const jwt = require('../services/jwt.js');

function registerUser(req, res) {
    let params = req.body;
    let user = new User();

    if (params.email && params.password && params.nick && params.name) {
        user.email = params.email;
        user.nick = params.nick;
        user.name = params.name;
        user.role = 'ROLE_USER';
        user.image = null;
        user.banner = null;
        user.biography = null;

        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición de registro de usuario"
                });
            if (users && users.length >= 1) {
                return res.status(200).send({
                    message: "[ERROR]: El usuario ya existe"
                });
            } else {
                bcrypt.hash(params.password, 10, (err, hash) => {
                    if (err)
                        return res.status(500).send({
                            message: "[ERROR]: Al encriptar la contraseña"
                        });
                    user.password = hash;
                    if (hash) {
                        user.save((err, userStored) => {
                            if (err)
                                return res.status(500).send({
                                    message: "[ERROR]: Al guardar el usuario"
                                });
                            if (userStored) {
                                return res.status(200).send({
                                    user: userStored
                                });
                            } else {
                                return res.status(404).send({
                                    message: "[ERROR]: Al guardar el usuario"
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        return res.status(500).send({
            message: "[ERROR]: Datos de registro incompletos"
        });
    }
}

function loginUser(req, res) {
    let params = req.body;
    let email = params.email;
    let password = params.password;

    User.findOne({ email: email }, (err, user) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición de inicio de sesión de usuario"
            });
        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    if (params.gettoken) {
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        user.password = undefined;
                        return res.status(200).send({ user });
                    }
                } else {
                    return res.status(404).send({
                        message: "[ERROR]: Contraseña incorrecta"
                    })
                }
            });
        } else {
            return res.status(404).send({
                message: "[ERROR]: Correo incorrecto"
            });
        }
    });
}

function getUser(req, res) {
    let userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición datos de usuario"
            });
        if (!user)
            return res.status(500).send({
                message: "[ERROR]: No se encuentra el usuario"
            });
        followUser(req.user.sub, userId).then((value) => {
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}

async function followUser(user_identity, user_followed) {
    let following = await Follow.findOne({
        'user': user_identity,
        'followed': user_followed
    }).exec().then((follow) => {
        return follow;
    }).catch((err) => {
        return handleError(err);
    });

    let followed = await Follow.findOne({
        'user': user_followed,
        'followed': user_identity
    }).exec().then((follow) => {
        return follow;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        following: following,
        followed: followed
    };
}

function getUsers(req, res) {
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    const itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage,
        (err, users, total) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición listado de usuarios"
                });
            if (!users)
                return res.status(404).send({
                    message: "[ERROR]: No hay usuarios"
                });
            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
}

/* Unused: */
async function followUsers(user_identity) {
    let following = await Follow.find({
        'user': user_identity
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
        'followed': user_identity
    }).select({
        '_id': 0, '__uv': 0, 'user': 0
    }).exec().then((follows) => {
        let follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.user);
        });
        return follows_clean;
    });
    return {
        following: following,
        followed: followed
    };
}

function getCounters(req, res) {
    let userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    countersUser(userId).then((value) => {
        return res.status(200).send(value);
    });
}

async function countersUser(userId) {
    try {
        const following = await Follow.countDocuments({
            'user': userId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
        const followed = await Follow.countDocuments({
            'followed': userId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
        const publications = await Publication.countDocuments({
            'user': userId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
        const likes = await Like.countDocuments({
            'user': userId
        }).exec().then((value) => {
            return value;
        }).catch((err) => {
            return;
        });
        return {
            following: following,
            followed: followed,
            publications: publications,
            likes: likes
        };
    } catch (err) {
        console.log(err);
    }
}

function updateUser(req, res) {
    let userId = req.params.id;
    let update = req.body;
    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({
            message: "[ERROR]: No tienes permisos para actualizar el usuario"
        });
    }

    User.find({
        $or: [
            { email: update.email.toString().toLowerCase() },
            { nick: update.nick.toString().toLowerCase() }
        ]
    }).exec((err, users) => {
        let user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId)
                user_isset = true;
        });
        if (user_isset)
            return res.status(404).send({
                message: "[ERROR]: El usuario ya existe"
            });
        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición actualizar usuario"
                });
            if (!userUpdated)
                return res.status(404).send({
                    message: "[ERROR]: Al actualizar el usuario"
                });
            return res.status(200).send({
                user: userUpdated
            });
        });
    });
}

function updateProfile(req, res) {
    let userId = req.params.id;
    let update = req.body;

    if (userId !== req.user.sub) {
        return res.status(500).send({
            message: "[ERROR]: No tienes permisos para editar el perfil " +
                "de este usuario"
        });
    }

    User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición para editar el perfil de usuario"
            });
        if (!userUpdated) {
            return res.status(500).send({
                message: "[ERROR]: No se ha editado el usuario"
            });
        }
        return res.status(200).send({
            user: userUpdated
        });
    });
}

function updatePassword(req, res) {
    const userId = req.user.sub;
    const params = req.body;
    const actualPassword = req.body.actualpassword;
    const newPassword = req.body.newpassword;

    User.findById(userId, (err, user) => {
        if (err)
            return res.status(500).send({
                message: "[ERROR]: Petición datos de usuario"
            });
        if (!user)
            return res.status(500).send({
                message: "[ERROR]: No se encuentra el usuario"
            });
        let userPassword = user.password;
        bcrypt.compare(actualPassword, userPassword, (err, result) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición al comparar las contraseñas"
                });
            if (result) {
                bcrypt.hash(newPassword, 10, (err, hash) => {
                    if (err) {
                        return res.status(404).send({
                            message: "[ERROR]: Petición para encriptar la nueva contraseña"
                        });
                    }
                    req.body.password = hash;
                    User.findByIdAndUpdate(userId, params, { new: true }, (err, userUpdated) => {
                        if (err)
                            return res.status(500).send({
                                message: "[ERROR]: Petición de actualizar el usuario"
                            });
                        if (!userUpdated)
                            return res.status(404).send({
                                message: "[ERROR]: Al actualizar el usuario"
                            });
                        return res.status(200).send({
                            user: userUpdated
                        });
                    });
                });
            } else {
                return res.status(404).send({
                    message: "[ERROR]: La contraseña actual es incorrecta"
                });
            }
        });
    });
}

function uploadImage(req, res) {
    let userId = req.params.id;

    if (req.files) {
        let file_path = req.files.image.path;

        if (userId !== req.user.sub) {
            return fs.unlink(file_path, (err) => {
                res.status(500).send({
                    message: "[ERROR]: No tienes permisos para actualizar la imagen"
                        + " de este usuario"
                });
            });
        }

        let file_split = file_path.split('\\');
        let file_name = file_split[2];
        let ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg') {
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true },
                (err, userUpdated) => {
                    if (err)
                        return res.status(500).send({
                            message: "[ERROR]: Petición para actualizar la imagen "
                                + "de este usuario"
                        });
                    if (!userUpdated) {
                        return res.status(404).send({
                            message: "[ERROR]: Al actualizar la imagen del usuario"
                        });
                    }
                    return res.status(200).send({
                        user: userUpdated
                    });
                });
        } else {
            return fs.unlink(file_path, (err) => {
                res.status(404).send({
                    message: "[ERROR]: Extensión de imagen inválida"
                });
            });
        }
    } else {
        return res.status(404).send({
            message: "[ERROR]: No se localiza ningún archivo"
        });
    }
}

function uploadBanner(req, res) {
    let userId = req.params.id;

    if (req.files) {
        let file_path = req.files.banner.path;

        if (userId !== req.user.sub) {
            return fs.unlink(file_path, (err) => {
                res.status(500).send({
                    message: "[ERROR]: No tienes permisos para actualizar el"
                        + " banner de este usuario"

                });
            });
        }

        let file_split = file_path.split('\\');
        let file_name = file_split[2];
        let ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg') {
            User.findByIdAndUpdate(userId, { banner: file_name }, { new: true },
                (err, userUpdated) => {
                    if (err)
                        return res.status(500).send({
                            message: "[ERROR]: Petición para actualizar el banner "
                                + "de este usuario"
                        });
                    if (!userUpdated) {
                        return res.status(404).send({
                            message: "[ERROR]: Al actualizar el banner del usuario"
                        });
                    }
                    return res.status(200).send({
                        user: userUpdated
                    });
                });
        } else {
            return fs.unlink(file_path, (err) => {
                res.status(404).send({
                    message: "[ERROR]: Extensión del banner inválida"
                });
            });
        }
    } else {
        return res.status(404).send({
            message: "[ERROR]: No se localiza ningún archivo"
        });
    }
}

function getImage(req, res) {
    let image = req.params.image;
    let path_file = './uploads/users/' + image;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({
                message: "[ERROR]: No se encuentra la imagen"
            });
        }
    });
}

function getBanner(req, res) {
    let banner = req.params.banner;
    let path_file = './uploads/banners/' + banner;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({
                message: "[ERROR]: No se encuentra el banner"
            });
        }
    });
}

function searchUsers(req, res) {
    let word = req.body.word;
    let page = 1;
    const itemsPerPage = 5;
    if (req.params.page) {
        page = req.params.page;
    }
    const r = new RegExp(`\w*${word}\w*`, "i");
    User.find({
        'nick': r
    }).sort('nick').paginate(page, itemsPerPage,
        (err, users, total) => {
            if (err)
                return res.status(500).send({
                    message: "[ERROR]: Petición listado de usuarios"
                });
            if (!users)
                return res.status(404).send({
                    message: "[ERROR]: No hay usuarios"
                });
            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
}

module.exports = {
    registerUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    updateProfile,
    uploadImage,
    uploadBanner,
    getImage,
    getBanner,
    updatePassword,
    searchUsers
};


