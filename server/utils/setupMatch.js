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
                map: data.map[0]
            });

            const rcon = server(data.serverIP);

            match.save().then(() =>
                rcon
                    .connect()
                    .then(() => rcon.command(`get5_loadmatch_url "${process.env.SERVER_CONFIG_URL}/match/${data.roomID}/config"`))
                    .then(async () => {
                        await rcon.command("sm_whitelist_resettodefault");

                        data.team_1.forEach(async player => {
                            await rcon.command(`sm_whitelist_add "${player.steamID}"`);
                        });

                        data.team_2.forEach(async player => {
                            await rcon.command(`sm_whitelist_add "${player.steamID}"`);
                        });
                    })
                    .then(() => rcon.disconnect())
                    .then(() => resolve(data.serverIP))
                    .catch(err => reject(err))
            );
        });
    });
