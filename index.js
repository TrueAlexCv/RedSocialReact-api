'use strict';

const mongoose = require('mongoose');
const app = require('./app');
const port = 3800;

const chalk = require('chalk');
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Conexión MongoDB:
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/RedSocial",
    {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log(`${chalk.yellow('MongoDB')} conectado a la base de datos: ${chalk.green('RedSocial')}`);
    })
    .catch(error => console.log(error));

// SocketIO:
io.on('connection', function (socket) {
    const userId = socket.id;
    console.log(`${chalk.blue(`Nuevo dispositivo conectado: ${userId}`)}`);

    socket.emit('message', {
        msg: `Hola tu eres ${userId}`
    });

    socket.on('default', function (res) {
        switch (res.event) {
            case 'message':
                const inPayload = res.payload;
                io.emit('message', {
                    msg: `Mensaje: ${inPayload.message}`
                });
                break;
        }
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

// Conexión API:
app.listen(port, () => {
    console.log(`${chalk.blue('Servidor')} escuchando por el puerto: ${chalk.green(3800)}`);
});

// Conexión SocketIO:
server.listen(5000, function () {
    console.log(`${chalk.red('Socket')} escuchando por el puerto: ${chalk.green('5000')}`);
});
