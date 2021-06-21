const socketio = require("socket.io");
const createRoom = require("../utils/createRoom");
const Room = require("../models/Room");

let players = [];

module.exports = server => {
    const io = socketio(server, {
        cors: {
            origin: "*"
        }
    });

    // Handle player matchmaking
    io.of("/matchmaking").on("connection", socket => {
        socket.on("searching", id => {
            socket.join("lobby");
            players.push(id);

            // TODO: Add server verification support
            if (players.length === 2) {
                createRoom(players).then(room => io.of("/matchmaking").in("lobby").emit("matchFound", room));
                players = [];
            }
        });

        socket.on("cancel", id => {
            socket.leave("lobby");
            players = players.filter((value, index) => value != id);
        });
    });

    // Handle chat and match status
    io.of("/room").on("connection", socket => {
        console.log("New Connection", socket.id);

        // Map Veto
        socket.on("joinRoom", data => {
            socket.join([data.room, data.team]);

            Room.findOne({ roomID: data.room }, { __v: 0 }, (err, body) => {
                if (err) throw err;

                io.of("/room").in(data.room).emit("startVeto");
                io.of("/room").in(data.room).emit("turn", body.vetoTurn);
            });
        });

        socket.on("banMap", data => {
            io.of("/room").in(data.room).emit("incTime");
            Room.findOneAndUpdate({ roomID: data.room }, { $pull: { map: data.map } }, { new: true, useFindAndModify: false }, (err, body) => {
                if (err) throw err;

                if (body.map.length > 1) {
                    io.of("/room").in(data.room).emit("mapBanned", data.map);
                    if (body.vetoTurn == body.captain_1) body.vetoTurn = body.captain_2;
                    else body.vetoTurn = body.captain_1;

                    body.save().then(() => io.of("/room").in(data.room).emit("turn", body.vetoTurn));
                } else {
                    io.of("/room").in(data.room).emit("loading");
                    setTimeout(() => io.of("/room").in(data.room).emit("mapSelected", body.map[0]), 5000);
                }
            });
        });

        socket.on("randomMap", room => {
            io.of("/room").in(room).emit("loading");
            try {
                Room.findOne({ roomID: room }, { map: 1 }, (err, body) => {
                    if (err) throw err;

                    while (body.map.length > 1) body.map.splice(Math.floor(Math.random() * body.map.length), 1);
                    body.save().then(res => setTimeout(() => io.of("/room").in(room).emit("mapSelected", res.map[0]), 5000));
                });
            } catch (error) {
                console.log(error);
            }
        });

        // Room Chat
        socket.on("roomChat", (room, payload) => {
            io.of("/room").in(room).emit("roomMsg", payload);
        });

        // Team Chat    TODO: Modify this part
        socket.on("teamChat", (room, id, payload) => {
            Room.findOne({ roomID: room }, { _id: 0, __v: 0 }, (err, data) => {
                if (data.team_1.includes(id)) io.of("/room").in("A").emit("teamMsg", payload);
                else if (data.team_2.includes(id)) io.of("/room").in("B").emit("teamMsg", payload);
            });
        });
    });
};
