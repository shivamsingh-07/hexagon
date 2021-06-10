if (process.env.NODE_ENV != "production") require("dotenv");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require("./utils/passportConfig");

const app = express();

// Middlewares
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: "123!@#",
        resave: true,
        saveUninitialized: false,
    })
);
app.use(cookieParser("123!@#"));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
    res.send("This is the API of Hexagon.");
});
app.use("/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;
module.exports = app.listen(PORT, () => console.log(`Live on ${PORT}...`));
