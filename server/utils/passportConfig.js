const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

passport.use(
    "steam",
    new SteamStrategy(
        {
            returnURL: "http://localhost:5000/auth/steam/return",
            realm: "http://localhost:5000",
            apiKey: process.env.STEAM_AUTH_KEY
        },
        (identifier, profile, done) => {
            profile.identifier = identifier;
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((user, cb) => cb(null, user));
