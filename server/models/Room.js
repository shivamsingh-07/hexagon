const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: String,
        steamID: String,
        thumbnail: String,
        profile: String
    },
    { _id: false }
);

const RoomSchema = new mongoose.Schema({
    roomID: String,
    serverIP: String,
    timer: String,
    captain_1: UserSchema,
    captain_2: UserSchema,
    map: {
        type: [String],
        default: ["de_cache", "de_cbble", "de_dust2", "de_inferno", "cs_italy", "de_mirage", "de_nuke", "cs_office", "de_overpass", "de_train", "de_vertigo"]
    },
    vetoTurn: UserSchema,
    team_1: [UserSchema],
    team_2: [UserSchema],
    createdAt: { type: String, default: new Date().toUTCString() }
});

module.exports = mongoose.model("rooms", RoomSchema);
