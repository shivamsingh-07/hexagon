const router = require("express").Router();
const passport = require("passport");

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

router.get("/steam/return", passport.authenticate("steam", { failureRedirect: "/" }), (req, res) => {
    res.redirect("/auth");
});

router.get("/logout", (req, res) => {
    req.logOut();
    res.clearCookie("connect.sid");
    res.redirect("/");
});

module.exports = router;
