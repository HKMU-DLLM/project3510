const express = require("express");
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./database/database');

module.exports = router;