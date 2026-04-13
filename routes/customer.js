const express = require("express");
const router = express.Router();

router.get("/buy_ticket", (req, res) => {
    res.render("customer/buy_ticket");
});

module.exports = router;