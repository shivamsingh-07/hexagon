const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/mailer");
const Player = require("../models/Player");
const Verify = require("../models/Verify");

router.post(
    "/",
    (req, res, next) => {
        if (req.isAuthenticated()) return next();
        return res.status(401).json({ error: "Unauthorized user" });
    },
    (req, res) => {
        res.json(req.user);
    }
);

router.post("/login", (req, res, next) =>
    passport.authenticate("local", (err, user, info) => {
        if (err) throw err;
        if (info) return res.status(401).json({ error: info.message });

        req.logIn(user, error => {
            if (error) throw error;
            res.status(200).json({ message: "User Authenticated!" });
        });
    })(req, res, next)
);

router.post("/signup", (req, res) => {
    const { username, email, password } = req.body;

    Player.findOne({ $or: [{ username }, { email }] }, async (err, data) => {
        if (err) throw err;
        if (data) return res.status(400).json({ error: "Username or email already in use!" });

        const player = new Player({
            username: username,
            email: email,
            password: await bcrypt.hash(password, await bcrypt.genSalt(10))
        });

        player.save().then(user => {
            const OTP = Math.random().toString(24).slice(2);
            const hash = jwt.sign({ email: user.email }, OTP);

            const verification = new Verify({
                email: user.email,
                otp: OTP,
                code: hash
            });

            verification
                .save()
                .then(() => sendMail(user.email, "Verify Account", `${process.env.API_URL}/auth/verify/${hash}`))
                .then(() => res.json({ message: "Check your mail" }));
        });
    });
});

router.get("/verify/:hash", (req, res) => {
    const id = req.params.hash;

    Verify.findOne({ code: id }, (err, data) => {
        if (err) throw err;
        if (!data) return res.status(404).json("Invalid Code!");

        jwt.verify(id, data.otp, (err, info) => {
            if (err) return res.end("Error Occured: Invalid Token");

            // Verifying Account
            Player.findOne({ email: data.email }, (err, obj) => {
                if (err) return res.status(500).end(err);
                if (!obj) return res.status(404).end("User not found!");

                obj.verified = true;
                obj.save().then(() =>
                    Verify.deleteOne({ code: id }, (err, obj) => {
                        if (err) return res.status(500).send(err);
                        res.send(data.email + " is verified.");
                    })
                );
            });
        });
    });
});

router.get("/steam", passport.authenticate("steam"));

router.get("/steam/return", (req, res, next) =>
    passport.authenticate("steam", (err, profile, info) => {
        if (err) throw err;
        if (!req.isAuthenticated()) return res.status(401).send({ message: "Unauthorized user!" });
        if (info) return res.json(info);

        Player.findOne({ username: req.user.username }, (err, player) => {
            if (err) throw err;
            if (!player) return res.status(400).json({ message: "Invalid user!" });
            if (player.steamID64) return res.status(400).json({ message: "Steam account already added!" });

            player.steamID64 = profile.id;
            player.thumbnail = profile.photos[2].value;
            player.profileUrl = profile._json.profileurl;

            player.save().then(() => res.json({ message: "Steam account added" }));
        });
    })(req, res, next)
);

router.post("/logout", (req, res) => {
    req.logOut();
    req.session = null;
    res.clearCookie("connect.sid");
    res.redirect("/");
});

module.exports = router;
