const socketio = require("socket.io");
const createRoom = require("../utils/createRoom");
const Room = require("../models/Room");
const setupMatch = require("../utils/setupMatch");
const serverStatus = require("../utils/serverStatus");

const maxPlayers = 2;
let queue = [];

module.exports = server => {
    const io = socketio(server, {
        cors: {
            origin: "*"
        }
    });

    // Handle player matchmaking
    io.of("/matchmaking").on("connection", socket => {
        socket.on("searching", user => {
            socket.join("lobby");
            queue.push(user);

            if (queue.length === maxPlayers)
                serverStatus().then(server => {
                    if (server != null) {
                        let players = queue,
                            array = [];
                        players.reverse();
                        for (let i = 0; i < maxPlayers; i++) array.push(players.pop());
                        queue = players.reverse();
                        createRoom(array, server).then(room => io.of("/matchmaking").in("lobby").emit("matchFound", room));
                    }
                });
        });

        socket.on("cancel", user => {
            socket.leave("lobby");
            queue = queue.filter((value, index) => value != user);
        });
    });

    // Handle chat and match status
    io.of("/room").on("connection", socket => {
        // Map Veto
        socket.on("joinRoom", data => {
            socket.join([data.room, data.team]);

            Room.findOne({ roomID: data.room }, { __v: 0, _id: 0 }, (err, body) => {
                if (err) throw err;

                io.of("/room").in(data.room).emit("startVeto", 59);
                io.of("/room").in(data.room).emit("turn", body.vetoTurn);
            });
        });

        socket.on("banMap", data => {
            // io.of("/room").in(data.room).emit("incTime");
            Room.findOneAndUpdate({ roomID: data.room }, { $pull: { map: data.map } }, { new: true, useFindAndModify: false }, (err, body) => {
                if (err) throw err;

                if (body.map.length > 1) {
                    io.of("/room").in(data.room).emit("mapBanned", data.map);
                    if (body.vetoTurn.name == body.captain_1.name) body.vetoTurn = body.captain_2;
                    else body.vetoTurn = body.captain_1;

                    body.save().then(() => io.of("/room").in(data.room).emit("turn", body.vetoTurn));
                } else {
                    io.of("/room").in(data.room).emit("loading");
                    setupMatch(body.roomID).then(ip =>
                        io
                            .of("/room")
                            .in(data.room)
                            .emit("mapSelected", { connect: `${ip}`, map: body.map[0] })
                    );
                }
            });
        });

        socket.on("randomMap", room => {
            io.of("/room").in(room).emit("loading");
            try {
                Room.findOne({ roomID: room }, { map: 1 }, (err, body) => {
                    if (err) throw err;

                    while (body.map.length > 1) body.map.splice(Math.floor(Math.random() * body.map.length), 1);
                    body.save().then(res =>
                        // setupMatch(res.roomID).then(ip =>
                        //     io
                        //         .of("/room")
                        //         .in(res.room)
                        //         .emit("mapSelected", { connect: `connect ${ip}`, map: res.map[0] })
                        // )
                        io.of("/room").in(room).emit("mapSelected", { connect: `connect xyz`, map: "de_mirage" })
                    );
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
