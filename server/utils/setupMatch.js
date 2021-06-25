const server = require("../config/rcon");
const Room = require("../models/Room");
const Match = require("../models/Match");

module.exports = roomID =>
    new Promise((resolve, reject) => {
        Room.findOne({ roomID }, (err, data) => {
            if (err) reject(err);
            if (!data) reject("Invalid Room ID");

            const match = new Match({
                matchID: data.roomID,
                apiKey: "",
                map: data.map
            });

            const rcon = server(data.serverIP);

            match.save().then(() =>
                rcon
                    .connect()
                    .then(() => rcon.command(`get5_loadmatch_url "${process.env.SERVER_CONFIG_URL}/match/${data.roomID}/config"`))
                    .then(async () => {
                        await rcon.command("sm_whitelist_resettodefault");

                        data.team_1.forEach(player => {
                            await rcon.command(`sm_whitelist_add "${player}"`);
                        });

                        data.team_2.forEach(player => {
                            await rcon.command(`sm_whitelist_add "${player}"`);
                        });
                    })
                    .then(() => rcon.disconnect())
                    .then(() => resolve(data.serverIP))
                    .catch(err => reject(err))
            );
        });
    });
