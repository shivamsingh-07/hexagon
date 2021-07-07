const mongoose = require("mongoose");

const verifySchema = new mongoose.Schema({
    email: String,
    otp: String,
    code: String,
    createdAt: { type: String, default: new Date().toDateString() }
});

module.exports = mongoose.model("verifications", verifySchema);
