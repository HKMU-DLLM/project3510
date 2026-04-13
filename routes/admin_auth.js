const express = require("express");
const Database = require('better-sqlite3');
const db = new Database('./database/database');
const router = express.Router();
const isAdmin = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    } else {
        return res.redirect('/admin');
    }
};
router.get("/", (req, res) => {

    res.render("admin_login");
});
router.get("/form", isAdmin, (req, res) => {

    res.render("admin_form");
});
router.post("/login", (req, res) => {
	console.log("Login attempt:", req.body);

	let username = req.body.username;
    let password = req.body.password;
    if (username === "admin" && password === "admin123") {
        req.session.isLoggedIn = true;
        req.session.name = "admin";
        return res.redirect("/admin/form");
    }else {
        return res.status(401).send("Invalid Username or Password. <a href='/admin'>Try again</a>");
    }
	
});

router.post("/concerts/create", isAdmin, (req, res) => {
    // Handle concert creation logic here
    const { title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO Concerts (title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stmt.run(title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date);
    } catch (error) {
        console.error("Error inserting concert:", error);
        return res.status(500).send("An error occurred while creating the concert. <a href='/admin/form'>Try again</a>");
    }

    return res.send("Concert created successfully! <a href='/admin/form'>Create another</a>");
});

module.exports = router;