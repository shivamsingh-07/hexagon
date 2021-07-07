if (process.env.NODE_ENV != "production") require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
const SessionStore = require("connect-mongo");
const RateStore = require("rate-limit-mongo");

require("./config/database");
require("./config/passport");
require("ejs");

const app = express();
const limiter = new RateLimit({
    store: new RateStore({
        uri: process.env.MONGO_URI,
        collectionName: "rate_limits",
        expireTimeMs: 60 * 60 * 1000
    }),
    max: 10,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests created from this IP, please try again after an hour..."
});

// Middlewares
app.use("/auth/steam", limiter);
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: false,
        store: SessionStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 60 * 60 * 24
        }),
        cookie: {
            maxAge: 60 * 60 * 24 * 1000
        }
    })
);
app.use(cookieParser("123!@#"));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
    res.send("Hexagon API");
});
app.use("/auth", require("./routes/auth"));
app.use("/room", require("./routes/room"));
app.use("/match", require("./routes/match"));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Live on ${PORT}...`));

// Web Socket
require("./config/socket")(server);

module.exports = server;
