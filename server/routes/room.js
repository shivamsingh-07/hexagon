const router = require("express").Router();
const Room = require("../models/Room");

const checkAuth = (req, res, next) => {
    Room.findOne({ roomID: req.params.id }, (err, data) => {
        if (err) return res.json({ error: "404" });

        if (req.isAuthenticated() && (data.team_1.includes(req.user.id) || data.team_2.includes(req.user.id))) next();
        else res.redirect("/");
    });
};

router.get("/:id", checkAuth, (req, res) => {
    res.send("Map Veto");
});

module.exports = router;
