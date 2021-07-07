const { nanoid } = require("nanoid");
const Room = require("../models/Room");
const Server = require("../models/Server");

module.exports = (array, server) =>
    new Promise((resolve, reject) => {
        // Create teams and select captain then return room id
        const half = Math.ceil(array.length / 2);

        // Create Teams
        const team_1 = array.slice(0, half);
        const team_2 = array.slice(-half);

        // Select captain
        const captain_1 = team_1[Math.floor(Math.random() * team_1.length)];
        const captain_2 = team_2[Math.floor(Math.random() * team_2.length)];

        // Create room
        const room = new Room({
            roomID: nanoid(),
            serverIP: server,
            captain_1,
            captain_2,
            vetoTurn: [captain_1, captain_2][Math.floor(Math.random() * 2)],
            team_1,
            team_2
        });

        Server.findOne({ credential: server }, (err, data) => {
            if (err) reject(err);

            data.availability = false;
            console.log("hi");
            data.save().then(() => room.save().then(data => resolve(data.roomID)));
        });
    });
