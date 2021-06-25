const Server = require("../models/Server");

module.exports = () =>
    new Promise((resolve, reject) =>
        Server.find({}, (err, data) => {
            if (err) reject(err);

            data.forEach(server => {
                if (server.availability) resolve(server.credential);
            });

            resolve(null);
        })
    );
