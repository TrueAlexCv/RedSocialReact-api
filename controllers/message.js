'use strict';

const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');

// Models:
const Message = require('../models/message');

function addMessage(req, res) {
    var params = req.body;

    if (!params.text || !params.receiver) {
        return res.status(404).send({
            message: "[ERROR]: No estan todos los datos requeridos"
        });
    }

    const message = new Message();
    message.text = params.text;
    message.viewed = false;
    message.created_at = moment().unix();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;

    message.save((err, messageStored) => {
        if (err) {
            return res.status(500).send({
                message: "[ERROR]: Petición de almacenar el mensaje"
            });
        }
        if (!messageStored) {
            return res.status(404).send({
                message: "[ERROR]: No se ha guardado el mensaje"
            });
        }
        return res.status(200).send({
            messageStored: messageStored
        });
    });
}

function deleteMessage(req, res) {
    const userId = req.user.sub;
    const messageId = req.params.id;
    Message.find({
        emitter: userId,
        _id: messageId
    }).remove((err) => {
        if(err) {
            return res.status(404).send({
                message: "[ERROR]: Al eliminar el mensaje"
            });
        }
        return res.status(200).send({
            message: "Mensaje eliminado correctamente"
        });
    })
}

function getMessages(req, res) {
    const userId = req.user.sub;
    const params = req.body
    const receiver = params.receiver;
    if (!params.receiver) {
        return res.status(404).send({
            message: "[ERROR]: No se localiza el receiver"
        });
    }
    const itemsPerPage = 10;
    const page = 1;
    Message.find({
        $or:
            [{emitter: userId, receiver: receiver},
                {emitter: receiver, receiver: userId}]
    }).sort('created_at').populate('emitter receiver')
        .paginate(page, itemsPerPage, (err, messages, total) => {
            if (err) {
                return res.status(500).send({
                    message: "[ERROR]: Petición mensajes enviados"
                });
            }
            if (!messages) {
                return res.status({
                    message: "[ERROR]: No hay mensajes enviados"
                });
            }
            return res.status(200).send({
                total: total,
                page: page,
                pages: Math.ceil(total / itemsPerPage),
                messages: messages
            });
        });
}

function setViewedMessages(req, res) {
    const userId = req.user.sub;
    const params = req.body;
    const emitter = params.emitter;

    Message.updateMany({emitter: emitter, receiver: userId, viewed: false}, {viewed: true},
        {'multi': true}, (err, messagesUpdated) => {
            if (err) {
                return res.status(500).send({
                    message: "[ERROR]: Petición actualizar mensajes vistos"
                });
            }
            if (!messagesUpdated) {
                return res.status(404).send({
                    message: "[ERROR]: Los mensajes no se han actualizado a vistos"
                });
            }
            return res.status(200).send({
                messages: messagesUpdated
            });
        });
}

function getEmittedMessages(req, res) {
    const userId = req.user.sub;
    const params = req.body
    const receiver = params.receiver;
    if (!params.receiver) {
        return res.status(404).send({
            message: "[ERROR]: No se localiza el emitter"
        });
    }
    const itemsPerPage = 10;
    const page = 1;
    Message.find({emitter: userId, receiver: receiver}).sort('created_at')
        .paginate(page, itemsPerPage, (err, messages, total) => {
            if (err) {
                return res.status(500).send({
                    message: "[ERROR]: Petición mensajes recibidos"
                });
            }
            if (!messages) {
                return res.status({
                    message: "[ERROR]: No hay mensajes recibidos"
                });
            }
            return res.status(200).send({
                total: total,
                page: page,
                pages: Math.ceil(total / itemsPerPage),
                messages: messages
            });
        });
}

function getReceivedMessages(req, res) {
    const userId = req.user.sub;
    const params = req.body
    const emitter = params.emitter;
    if (!params.emitter) {
        return res.status(404).send({
            message: "[ERROR]: No se localiza el emitter"
        });
    }
    const itemsPerPage = 10;
    const page = 1;
    Message.find({emitter: emitter, receiver: userId}).sort('created_at')
        .paginate(page, itemsPerPage, (err, messages, total) => {
            if (err) {
                return res.status(500).send({
                    message: "[ERROR]: Petición mensajes recibidos"
                });
            }
            if (!messages) {
                return res.status({
                    message: "[ERROR]: No hay mensajes recibidos"
                });
            }
            return res.status(200).send({
                total: total,
                page: page,
                pages: Math.ceil(total / itemsPerPage),
                messages: messages
            });
        });
}

module.exports = {
    addMessage,
    deleteMessage,
    getMessages,
    setViewedMessages,
    getEmittedMessages,
    getReceivedMessages,
}
