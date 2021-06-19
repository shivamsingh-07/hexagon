const router = require("express").Router();
const passport = require("passport");
const Player = require("../models/Player");

router.get(
    "/",
    (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect("/");
    },
    (req, res) => {
        res.json(req.user);
    }
);

router.get("/steam", passport.authenticate("steam"));

router.get("/steam/return", (req, res, next) =>
    passport.authenticate("steam", (err, user, info) => {
        if (err) return next(err);
        if (info) return res.send(info);

        Player.findOne({ steamID64: user.id }, async (err, data) => {
            if (err) throw err;

            if (!data) {
                const player = new Player({
                    displayName: user.displayName,
                    steamID64: user.id,
                    thumbnail: user.photos[2].value,
                    profileUrl: user._json.profileurl
                });
                await player.save();
            }

            req.logIn(user, e => {
                if (e) throw e;

                res.redirect("/auth");
            });
        });
    })(req, res, next)
);

router.get("/logout", (req, res) => {
    req.logOut();
    req.session = null;
    res.clearCookie("connect.sid");
    res.redirect("/");
});

module.exports = router;
