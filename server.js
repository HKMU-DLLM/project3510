const express = require("express");
const session = require("express-session");
const Database = require('better-sqlite3');
const db = require("./database/database.js");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const i18n = require("i18n");
const app = express();
const server = http.createServer(app);

const adminRouter = require("./routes/admin_auth");
const concertRouter = require("./routes/concert");
const customerRouter = require("./routes/customer");

i18n.configure({
  locales: ["en", "zh"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  queryParameter: "lang"
});

app.use(i18n.init);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false },
	})
);

app.get("/", (req, res) => {
  console.log("New access to website");
try {
        const concertData = db.prepare("SELECT * FROM Concerts").all();

        res.status(200).render("main", {
            concert: concertData,                  
            title: res.__("title"),                 
            welcome: res.__("welcome"),            
            isLoggedIn: req.session && req.session.isLoggedIn  
        });
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});

app.use("/admin", adminRouter);
app.use("/concert", concertRouter);
app.use("/customer", customerRouter);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});