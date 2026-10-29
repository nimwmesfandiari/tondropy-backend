const express = require("express");
const path = require("path");

// Load the existing TON Dropy Express application.
// Nothing inside api/index.js is removed or modified.
const app = require("./api/index.js");

// Serve the existing Mini App from public/index.html
app.use(express.static(path.join(__dirname, "public")));

// If the request is for the website root,
// serve the existing Mini App.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
