const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true }, err => {
    if (err) throw err;
    console.log("Database connected...");
});
