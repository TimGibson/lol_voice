require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = require("socket.io")(server, {
    allowEIO3: true,
    cors: {
      origin: "*",
    }
  });

const users = {};

const socketToRoom = {};


io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerId: payload.callerId });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerId).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('user disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        console.log('room before', room)
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
            room.forEach(user => {
               room2 = room.filter(id => id !== user)
               io.to(user).emit('user left', { room: room2, userLeaving: socket.id }) 
            })
        }
        console.log('user disconnected', room)
    });
});

app.get('/test', (req, res) => {
    res.send('sup btch')
  })

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));

