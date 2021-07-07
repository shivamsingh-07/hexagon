const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
    matchID: String,
    apiKey: { type: String, default: "" },
    demoFile: { type: String, default: null },
    map: String,
    winner: { type: String, default: null },
    forfeit: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    team_1_score: { type: Number, default: 0 },
    team_2_score: { type: Number, default: 0 },
    team_1: {
        type: Map,
        of: Object,
        default: null
    },
    team_2: {
        type: Map,
        of: Object,
        default: null
    },
    startedAt: { type: String, default: null },
    endedAt: { type: String, default: null }
});

module.exports = mongoose.model("matches", MatchSchema);
