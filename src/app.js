require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express(); // 👈 app MUST be defined first

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicRoutes = require("./routes/public");
app.use("/", publicRoutes);

// static files
app.use(express.static(path.join(__dirname, "public")));

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
const weddingRoutes = require("./routes/weddings");
app.use("/", weddingRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", app: "JT" });
});

module.exports = app;
