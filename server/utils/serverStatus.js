const Server = require("../models/Server");
const rcon = require("../config/rcon");

module.exports = () =>
    new Promise((resolve, reject) =>
        Server.find({}, (err, data) => {
            if (err) reject(err);

            data.forEach(server => {
                if (server.availability)
                    rcon(server.credential)
                        .connect()
                        .then(() => rcon(server.credential).disconnect())
                        .then(() => resolve(server.credential))
                        .catch(err => resolve(null));
            });

            resolve(null);
        })
    );
