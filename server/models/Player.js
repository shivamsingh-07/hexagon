const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    verified: { type: Boolean, default: false },
    steamID64: { type: String, default: null },
    thumbnail: { type: String, default: null },
    profileUrl: { type: String, default: null },
    createdAt: { type: String, default: new Date().toUTCString() }
});

module.exports = mongoose.model("players", PlayerSchema);
