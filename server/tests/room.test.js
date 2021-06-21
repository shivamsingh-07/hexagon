const mongoose = require("mongoose");
const Room = require("../models/Room");
const { nanoid } = require("nanoid");
require("dotenv").config();
require("../utils/database");

describe("Create New Room", () => {
    it("should create a new room", done => {
        const room = new Room({
            roomID: nanoid(),
            captain_1: "76561199179986255",
            captain_2: "76561199179954772",
            vetoTurn: "76561199179954772",
            team_1: ["76561199179986255", "76561199179954772"],
            team_2: ["76561199179954772", "76561198344056201"]
        });

        room.save().then(() => done());
    });

    after(() => {
        mongoose.connection.close();
    });
});
