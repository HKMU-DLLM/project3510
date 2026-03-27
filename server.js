const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const i18n = require("i18n");
const app = express();
i18n.configure({
  locales: ["en", "zh"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  queryParameter: "lang"
});

app.use(i18n.init);
const server = http.createServer(app);


const concertRouter = require("./routes/concert");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  console.log("New access to website");
  res.status(200).render("main", {
    title: res.__("title"),
    welcome: res.__("welcome")
  });
});
app.use("/concert", concertRouter);
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
