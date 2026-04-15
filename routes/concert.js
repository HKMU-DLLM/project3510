const express = require("express");
const router = express.Router();
const Database = require('better-sqlite3');
const db = require("../database/database.js");

router.get("/", (req, res) => {
    try {
        const concert = db.prepare("SELECT * FROM Concerts").all();
        res.render("concert", { concert }); 
    } catch (err) {
        res.status(500).send("Database error");
    }
});

module.exports = router;