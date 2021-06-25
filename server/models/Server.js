const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema({
    credential: String,
    availability: { type: Boolean, default: true }
});

module.exports = mongoose.model("servers", ServerSchema);
