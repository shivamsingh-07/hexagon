const SteamID = require("steamid");
const server = require("../config/rcon");
const Room = require("../models/Room");
const Match = require("../models/Match");

module.exports = roomID =>
    new Promise((resolve, reject) => {
        Room.findOne({ roomID }, (err, data) => {
            if (err) reject(err);
            if (!data) reject("Invalid Room ID");

            const match = new Match({
                matchID: Math.floor(Math.random() * 1000000000),
                roomID: data.roomID,
                apiKey: Math.random().toString(20).slice(2).toUpperCase()
            });

            const rcon = server(data.serverIP);

            match.save().then(details =>
                rcon
                    .connect()
                    .then(() => rcon.command(`get5_loadmatch_url "${process.env.SERVER_CONFIG_URL}/match/${data.roomID}/config"`))
                    .then(() => rcon.command(`sm_cvar get5_web_api_key "${details.apiKey}"`))
                    .then(() => rcon.command("sm_whitelist_resettodefault"))
                    .then(() => {
                        data.team_1.forEach(async player => await rcon.command(`sm_whitelist_add "${new SteamID(player.steamID).getSteam2RenderedID(true)}"`));
                        data.team_2.forEach(async player => await rcon.command(`sm_whitelist_add "${new SteamID(player.steamID).getSteam2RenderedID(true)}"`));
                    })
                    .then(() => rcon.disconnect())
                    .then(() => resolve(data.serverIP))
                    .catch(err => reject(err))
            );
        });
    });
