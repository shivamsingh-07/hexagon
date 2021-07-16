const passport = require("passport");
const bcrypt = require("bcryptjs");
const checkAccount = require("../utils/checkAccount");
const SteamStrategy = require("passport-steam").Strategy;
const LocalStratergy = require("passport-local").Strategy;
const Player = require("../models/Player");

passport.use(
    "local",
    new LocalStratergy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        (email, pass, done) => {
            Player.findOne({ email }, { _id: 0, __v: 0, createdAt: 0 }, (err, player) => {
                if (err) return done(err);
                if (!player) return done(null, false, { message: "User not found" });
                if (!player.verified) return done(null, false, { message: "User not verified" });

                bcrypt.compare(pass, player.password, (err, result) => {
                    if (err) done(err);
                    if (result) return done(null, player);
                    return done(null, false, { message: "Email or password is incorrect!" });
                });
            });
        }
    )
);

passport.use(
    "steam",
    new SteamStrategy(
        {
            realm: `${process.env.API_URL}/auth/steam`,
            returnURL: `${process.env.API_URL}/auth/steam/return`,
            apiKey: process.env.STEAM_API_KEY
        },
        (identifier, profile, done) => {
            profile.identifier = identifier;

            checkAccount(profile.id)
                .then(code => {
                    switch (code) {
                        case 0:
                            done(null, profile);
                            break;
                        case 1:
                            done(null, false, { message: "Your account is banned by steam." });
                            break;
                        case 2:
                            done(null, false, { message: "Your account's game activity is private." });
                            break;
                        case 3:
                            done(null, false, { message: "Your CS:GO playtime is less than 50 hours." });
                            break;
                    }
                })
                .catch(err => done(err));
        }
    )
);

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((user, cb) => cb(null, user));
