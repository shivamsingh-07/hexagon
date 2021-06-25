const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    roomID: String,
    serverIP: String,
    captain_1: String,
    captain_2: String,
    map: {
        type: [String],
        default: ["de_cache", "de_cbble", "de_dust2", "de_inferno", "cs_italy", "de_mirage", "de_nuke", "cs_office", "de_overpass", "de_train", "de_vertigo"]
    },
    vetoTurn: String,
    team_1: [String],
    team_2: [String],
    createdAt: { type: String, default: new Date().toUTCString() }
});

module.exports = mongoose.model("rooms", RoomSchema);
