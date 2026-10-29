const express = require("express");
const path = require("path");

const app = require("./server.js");

// Serve the existing Mini App
app.use(express.static(path.join(__dirname, "public")));

// Main Mini App page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
