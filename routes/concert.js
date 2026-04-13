const express = require("express");
const router = express.Router();
const Database = require('better-sqlite3');
const db = require("../database/database.js");

router.get("/", (req, res) => {
    // Logic to fetch concerts from DB
    try {
        const concerts = db.prepare("SELECT * FROM Concerts").all();
        res.render("concerts", { concerts }); // Make sure you have views/concerts.ejs
    } catch (err) {
        res.status(500).send("Database error");
    }
});

module.exports = router;