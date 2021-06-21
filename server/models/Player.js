const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
    displayName: String,
    steamID64: String,
    thumbnail: String,
    profileUrl: String,
    createdAt: { type: String, default: new Date().toUTCString() }
});

module.exports = mongoose.model("players", PlayerSchema);