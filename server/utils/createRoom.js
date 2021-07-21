const { nanoid } = require("nanoid");
const Room = require("../models/Room");
const Server = require("../models/Server");

module.exports = (array, server) =>
    new Promise((resolve, reject) => {
        // Create teams and select captain then return room id
        const half = Math.ceil(array.length / 2);

        // Create Teams
        const team_1 = array.slice(0, half).sort(() => Math.random() - 0.5);
        const team_2 = array.slice(-half).sort(() => Math.random() - 0.5);

        // Select captain
        const captain_1 = team_1[0];
        const captain_2 = team_2[0];

        // Create room
        const room = new Room({
            roomID: nanoid(),
            serverIP: server,
            timer: new Date(new Date().getTime() + 60000).getTime(),
            captain_1,
            captain_2,
            vetoTurn: [captain_1, captain_2][Math.floor(Math.random() * 2)],
            team_1,
            team_2
        });

        Server.findOne({ credential: server }, (err, data) => {
            if (err) reject(err);

            data.availability = false;
            data.save().then(() => room.save().then(data => resolve(data.roomID)));
        });
    });
