const express = require("express");
const router = express.Router();
const db = require("../database/database.js");
const isAdmin = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    } else {
        return res.redirect('/admin');
    }
};

router.get("/", (req, res) => {
    res.render("admin/admin_login");
});

router.get("/form", isAdmin, (req, res) => {
    res.render("admin/admin_form");
});

router.get("/profile", isAdmin, (req, res) => {
    try{
        const rows = db.prepare("SELECT * FROM Concerts").all();
        res.render("admin/admin_profile", { concerts: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

router.post("/login", (req, res) => {
	console.log("Login attempt:", req.body);

	let username = req.body.username;
    let password = req.body.password;
    if (username === "admin" && password === "admin123") {
        req.session.isLoggedIn = true;
        req.session.name = "admin";
        return res.redirect("/admin/profile");
    }else {
        return res.status(401).send("Invalid Username or Password. <a href='/admin'>Try again</a>");
   }
	
});

router.post("/concerts/create", isAdmin, (req, res) => {
    const { title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO Concerts (title, organizer, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(title, organizer, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date);
    } catch (error) {
        console.error("Error inserting concert:", error);
        return res.status(500).send("An error occurred while creating the concert. <a href='/admin/form'>Try again</a>");
    }

    return res.redirect('/admin/profile');
});

module.exports = router;