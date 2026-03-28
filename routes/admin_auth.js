const express = require("express");
const router = express.Router();
const isAdmin = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    } else {
        // 3. If no, kick them back to the login page
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
        // Always send a response so the browser doesn't time out!
        return res.status(401).send("Invalid Username or Password. <a href='/admin/login'>Try again</a>");
    }
	
});

module.exports = router;