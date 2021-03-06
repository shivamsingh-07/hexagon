const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
    matchID: Number,
    apiKey: String,
    roomID: String,
    demoFile: { type: String, default: null },
    map: { type: String, default: null },
    winner: { type: String, default: null },
    forfeit: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    team_1_score: { type: Number, default: 0 },
    team_2_score: { type: Number, default: 0 },
    team_1: {
        type: Map,
        of: Object,
        default: {}
    },
    team_2: {
        type: Map,
        of: Object,
        default: {}
    },
    startedAt: { type: String, default: null },
    endedAt: { type: String, default: null }
});

module.exports = mongoose.model("matches", MatchSchema);
