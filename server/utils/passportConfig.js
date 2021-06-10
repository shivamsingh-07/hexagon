const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

passport.use(
    "steam",
    new SteamStrategy(
        {
            returnURL: "http://localhost:5000/auth/steam/return",
            realm: "http://localhost:5000",
            apiKey: "764AA9E9E5A4E1428C9C614A40E28ECF",
        },
        (identifier, profile, done) => {
            profile.identifier = identifier;
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((user, cb) => cb(null, user));
