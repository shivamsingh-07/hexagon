const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
    res.send("This is the API of Hexagon.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Live on ${PORT}...`));
