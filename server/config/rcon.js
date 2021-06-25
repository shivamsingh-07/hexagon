const Rcon = require("srcds-rcon");

module.exports = server =>
    Rcon({
        address: server,
        password: process.env.SERVER_RCON_PASSWORD
    });
