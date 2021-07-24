let express = require('express');
let app = express();
const PORT = process.env.PORT || 4000;
app.use(express.static('public'));
const http = require('http').Server(app);
let io = require('socket.io')(http);
app.get('/', (req, res) => res.send(__dirname + "/index.html"));
let server = http.listen(PORT, () => {
    console.log(`Listening to requests on port ${PORT}`);
});

// let server = app.listen(4000, () => {
//     console.log("Listening to requests on port 4000");
// });

let clientCount = 0;
let clientStatus = {};
let clientScores = {};
let allClientResponses = {};
let clients = [];

// App Setup
// const PORT = process.env.PORT || 3000;
// const INDEX = '/index.html';
// const server = express()
//   .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));

// const { Server } = require('ws');

// const wss = new Server({ server });

// Static Files
app.use(express.static('public'));

// Socket setup
// let io = socket(server);

io.on('connection', (socket) => {
    console.log("Socket connected", socket.id);

    socket.on('new-client', (data) => {
        console.log(data.client);
        if (clients.indexOf(data.client) != -1) {
            io.sockets.emit('client-exist', data);
            return;
        }
        clientStatus[data.client] = false;
        clients.push(data.client);
        clientCount++;
        io.sockets.emit('new-client', data);
    });

    socket.on('client-left', (data) => {
        let indexToRemove = clients.indexOf(data.client);
        if (indexToRemove > -1) {
            clients.splice(indexToRemove, 1);
        }
        clientCount--;
        delete clientStatus[data.client]
        socket.broadcast.emit('client-left', data);
    });

    socket.on('client-complete', (data) => {
        clientStatus[data.client] = true;
        allClientResponses[data.client] = data.responses;
        if (clientCount > 1) {
            io.sockets.emit('client-complete', data);
        } else {
            io.sockets.emit('client-alone', data.client);
        }

        // Check if all users have completed
        for (let key in clientStatus) {
            if(clientStatus[key] == false) {
                return;
            }
        }

        // Inform all users everyone has answered
        io.sockets.emit('all-complete', {
            allResponses: allClientResponses
        });
    });

    socket.on('client-guess-end', (data) => {
        clientScores[data.client] = data.score;
        io.sockets.emit('client-guess-end', data);

        // Check if all users have finished guessing
        for (let key in clientStatus) {
            if(!clientScores.hasOwnProperty(key)) {
                return;
            }
        }

        // Inform all users everyone has finished guessing
        io.sockets.emit('all-guesses-complete', {
            scoreboard: clientScores
        });
    });

});