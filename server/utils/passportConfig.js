const passport = require("passport");
const checkAccount = require("./checkAccount");
const SteamStrategy = require("passport-steam").Strategy;

passport.use(
    "steam",
    new SteamStrategy(
        {
            realm: `${process.env.API_URL}/auth/steam`,
            returnURL: `${process.env.API_URL}/auth/steam/return`,
            apiKey: process.env.STEAM_AUTH_KEY
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
                            done(null, false, { message: "Your CS:GO playtime is less than 100 hours." });
                            break;
                    }
                })
                .catch(err => done(null, false, { error: err }));
        }
    )
);

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((user, cb) => cb(null, user));
