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

router.get("/sales_report/:concertId", isAdmin, (req, res) => {
    const concertId = req.params.concertId;
    try {
        const sql_query = `
            SELECT 
                c.id AS concert_id,
                c.title AS concert_title,
                c.ZoneA_Ticket,
                c.ZoneB_Ticket,
                COUNT(DISTINCT ot.user_id) AS total_customers, 
                -- 使用 IFNULL 確保即使沒人買票也回傳 0 而不是 null
                IFNULL(SUM(ot.quantity), 0) AS total_tickets_sold,         
                
                IFNULL(SUM(CASE WHEN ot.chosen_zone = 'ZoneA' THEN ot.quantity ELSE 0 END), 0) AS zone_a_sold,
                IFNULL(SUM(CASE WHEN ot.chosen_zone = 'ZoneA' THEN (ot.quantity * c.ZoneA_Price) ELSE 0 END), 0) AS zone_a_revenue,

                IFNULL(SUM(CASE WHEN ot.chosen_zone = 'ZoneB' THEN ot.quantity ELSE 0 END), 0) AS zone_b_sold,
                IFNULL(SUM(CASE WHEN ot.chosen_zone = 'ZoneB' THEN (ot.quantity * c.ZoneB_Price) ELSE 0 END), 0) AS zone_b_revenue,

                -- 總收入計算
                IFNULL(
                    (SUM(CASE WHEN ot.chosen_zone = 'ZoneA' THEN (ot.quantity * c.ZoneA_Price) ELSE 0 END) +
                     SUM(CASE WHEN ot.chosen_zone = 'ZoneB' THEN (ot.quantity * c.ZoneB_Price) ELSE 0 END)), 
                0) AS total_revenue
    
            FROM Concerts c
            LEFT JOIN Order_tickets ot ON c.id = ot.concert_id
            WHERE c.id = ?
            GROUP BY c.id;
        `;
        const concert = db.prepare(sql_query).get(concertId);
        if (!concert) {
            return res.status(404).send("Concert not found");
        }
        
        res.render("admin/sales_report", { concert });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        return res.status(500).send("An error occurred while fetching the sales report.");
    }
});

router.get("/edit/:concertId", isAdmin, (req, res) => {
    const concertId = req.params.concertId;
    try {
        const concert = db.prepare("SELECT * FROM Concerts WHERE id = ?").get(concertId);
        if (!concert) {
            return res.status(404).send("Concert not found");
        }
        res.render("admin/edit_concert", { concert });
    }
    catch (error) {
        console.error("Error fetching concert for edit:", error);
        return res.status(500).send("An error occurred while fetching the concert details.");
    }
});

router.post("/edit/:concertId", isAdmin, (req, res) => {
    const concertId = req.params.concertId;
    const { title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date } = req.body;
    try {
        const stmt = db.prepare('UPDATE Concerts SET title = ?, ZoneA_Ticket = ?, ZoneA_Price = ?, ZoneB_Ticket = ?, ZoneB_Price = ?, location = ?, date = ? WHERE id = ?');
        stmt.run(title, ZoneA_Ticket, ZoneA_Price, ZoneB_Ticket, ZoneB_Price, location, date, concertId);
        return res.redirect('/admin/profile');
    } catch (error) {
        console.error("Error updating concert:", error);
        return res.status(500).send("An error occurred while updating the concert. <a href='/admin/profile'>Try again</a>");
    }
});

module.exports = router;