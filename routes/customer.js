const express = require("express");
const router = express.Router();
const db = require("../database/database.js");
const isCustomer = (req, res, next) => {
    if (req.session && req.session.isLoggedIn && req.session.user.role === 'customer') {
        return next();
    } else {
        req.session.returnTo = req.originalUrl;
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

        const redirectTo = req.session.returnTo || '/concert';
                delete req.session.returnTo;

        return res.redirect(redirectTo);

    } catch (err) {
        res.redirect('/customer');
    }
});


router.get("/buy_ticket/:id", isCustomer, (req, res) => {
    const id = req.params.id;

	try {
		const stmt = db.prepare("SELECT * FROM Concerts WHERE id = ?");
		const ticket = stmt.get(id);

        if (ticket.ready_to_launch === 0) {
                    return res.status(403).send("This concert is no longer accepting ticket purchases.");
                }

		res.render("customer/buy_ticket", { ticket, id });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});

router.post("/order", (req, res) => {
    const{ concert_id, qty_A, qty_B, price_A, price_B } = req.body;
    const userId = req.session.user.user_id;
    const userName = req.session.user.name;
    const total_paid = (qty_A * price_A) + (qty_B * price_B);

    try{
        const order_stmt = db.prepare(`INSERT INTO Orders(user_id, name, total_paid) VALUES(?,?,?) `);
        order_stmt.run(userId, userName, total_paid);
        const result = order_stmt.run(userId, userName, total_paid);
        const orderId = result.lastInsertRowid;

        const ticket_stmt = db.prepare(`INSERT INTO Order_tickets(concert_id, order_id, user_id, chosen_zone, quantity) VALUES(?,?,?,?,?)`);

        if (parseInt(qty_A)>0){
            ticket_stmt.run(concert_id, orderId, userId, 'Zone A', qty_A);
            db.prepare(`UPDATE Concerts SET Sold_ZoneA_Ticket = Sold_ZoneA_Ticket - ? WHERE id = ?`).run(qty_A, concert_id);
        }

        if (parseInt(qty_B)>0){
            ticket_stmt.run(concert_id, orderId, userId, 'Zone B', qty_B);
            db.prepare(`UPDATE Concerts SET Sold_ZoneB_Ticket = Sold_ZoneB_Ticket - ? WHERE id = ?`).run(qty_B, concert_id);
        }

        return res.redirect(`/customer/comfirm_order/${orderId}`);

    }catch (err) {
        res.status(500).send("Purchase failed: " + err.message);
    }
});

router.get("/comfirm_order/:id", isCustomer, (req, res) => {
    const id = req.params.id;

	try {
		const stmt = db.prepare("SELECT * FROM Orders WHERE order_id = ?");
		const order = stmt.get(id);

		res.render("customer/comfirm_order", { order, id });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});

router.get("/orderhistory", isCustomer, (req, res) => {
    const userId = req.session.user.user_id;

    try {
        const stmt = db.prepare(`
    SELECT o.order_id, o.total_paid, o.buying_time, ot.chosen_zone, ot.quantity, c.title, c.location, c.date, c.time
    FROM Orders o
    JOIN Order_tickets ot ON o.order_id = ot.order_id
    JOIN Concerts c ON ot.concert_id = c.id
    WHERE o.user_id = ?
    ORDER BY o.buying_time DESC
    `);
        const rows = stmt.all(userId);

        const groupedOrders = {};

        rows.forEach(row => {
            if (!groupedOrders[row.order_id]) {
                groupedOrders[row.order_id] = {
                    order_id: row.order_id,
                    total_paid: row.total_paid,
                    buying_time: row.buying_time,
                    title: row.title,
                    location: row.location,
                    date: row.date,
                    time: row.time,
                    tickets: []
                };
            }
            groupedOrders[row.order_id].tickets.push({
                zone: row.chosen_zone,
                quantity: row.quantity
            });
        });

        res.render("customer/customer_orderHistory", { orders: Object.values(groupedOrders) });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

module.exports = router;
