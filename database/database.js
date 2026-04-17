const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS Customer  (
    user_id         INTEGER     PRIMARY KEY AUTOINCREMENT,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    password        TEXT        NOT NULL,
    role            TEXT        NOT NULL DEFAULT 'customer'
);

CREATE TABLE IF NOT EXISTS Concerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT, 
    ZoneA_Ticket INTEGER DEFAULT (150), 
    ZoneA_Price INTEGER, 
    ZoneB_Ticket INTEGER DEFAULT (150),
    ZoneB_Price INTEGER, 
    location TEXT, 
    date TEXT,
    ready_to_launch INTEGER MOT NULL,
    organizer TEXT,
    time TEXT,
    Sold_ZoneA_Ticket INTEGER DEFAULT (0),
    Sold_ZoneB_Ticket INTEGER DEFAULT (0)
);  

CREATE TABLE IF NOT EXISTS Orders (
    order_id        INTEGER     PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER     NOT NULL,
    name            TEXT        NOT NULL,
    buying_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    total_paid      REAL    ,
    FOREIGN KEY (user_id) REFERENCES Customer(user_id)
);

CREATE TABLE IF NOT EXISTS Order_tickets (
    ticket_id       INTEGER     PRIMARY KEY AUTOINCREMENT,
    concert_id      INTEGER     NOT NULL,
    order_id        INTEGER     NOT NULL,
    user_id         INTEGER     NOT NULL,
    chosen_zone     TEXT,
    quantity        INTEGER,
    FOREIGN KEY (concert_id) REFERENCES Concerts(id),
    FOREIGN KEY (user_id) REFERENCES Customer(user_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);
`)
module.exports = db;