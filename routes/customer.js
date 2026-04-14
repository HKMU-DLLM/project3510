const express = require("express");
const router = express.Router();
const db = require("../database/database.js");
const isCustomer = (req, res, next) => {
    if (req.session && req.session.isLoggedIn && req.session.user.role === 'customer') {
        return next();
    } else {
        return res.redirect('/customer');
    }
};

router.get("/", (req, res) => {
    res.render("customer/customer_login");
});

router.get("/register", (req, res) => {
    res.render("customer/customer_register");
});

router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    try {
        //check
        if (!name || !email || !password) {
            return res.redirect('/customer/register');
        }
        
        const existingName = db.prepare(`
            SELECT * FROM Customer WHERE name = ?
        `).get(name);
        if (existingName) {
            return res.redirect('/customer/register?error=Username is already in use.');
        }

        const existingEmail = db.prepare(`
            SELECT * FROM Customer WHERE email = ?
        `).get(email);
        if (existingEmail) {
            return res.redirect('/customer/register?error=Email is already in use.');
        }
        
        db.prepare(`
            INSERT INTO Customer (name, email, password, role)
            VALUES (?, ?, ?, 'customer')
        `).run(name, email, password);

        res.redirect('/customer');

    } catch (err) {
        res.render('/customer/register');
    }
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    try {
        if (username === "admin" && password === "admin123") {
            req.session.isLoggedIn = true;
            req.session.user = { role: "admin" };
            return res.redirect('/admin/profile');
        }

        
        const user = db.prepare(`
            SELECT * FROM Customer 
            WHERE name = ? AND password = ?
        `).get(username, password);

        if (!user) {
            return res.redirect('/customer');
        }

        req.session.isLoggedIn = true;
        req.session.user = user;
        return res.redirect('/customer/buy_ticket');

    } catch (err) {
        res.redirect('/customer');
    }
});


router.get("/buy_ticket", (req, res) => {
    res.render("customer/buy_ticket");
});

module.exports = router;
