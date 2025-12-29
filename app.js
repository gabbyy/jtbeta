require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", app: "JT" });
});

module.exports = app;
