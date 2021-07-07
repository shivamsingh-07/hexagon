const router = require("express").Router();
const Room = require("../models/Room");

router.get("/:id", (req, res) => {
    Room.findOne({ roomID: req.params.id }, { _id: 0, __v: 0, createdAt: 0, serverIP: 0 }, (err, data) => {
        if (err) return res.json({ error: "404" });
        if (!data) return res.status(400).json({ error: "Invalid room!" });

        if (
            req.isAuthenticated() &&
            (data.team_1.some((user, index, array) => {
                return user.steamID == req.user.steamID64;
            }) ||
                data.team_2.some((user, index, array) => {
                    return user.steamID == req.user.steamID64;
                }))
        )
            res.send(data);
        else res.status(401).json({ error: "Unauthorized" });
    });
});

module.exports = router;
