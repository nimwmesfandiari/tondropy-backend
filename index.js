// TON Dropy - Vercel Express entry point
// Admin panel fix - does NOT modify server.js or existing APIs

const express = require("express");
const path = require("path");

const backend = require("./server.js");

const app = express();

/*
========================================================
ADMIN PANEL
========================================================

این مسیر قبل از server.js قرار گرفته تا پنل مدیریت
از public/admin.html خوانده شود.

تمام APIهای قبلی همچنان توسط server.js مدیریت می‌شوند.
*/

app.get(["/admin", "/admin/"], (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "admin.html")
  );
});

/*
========================================================
EXISTING BACKEND
========================================================

هیچ API قبلی حذف یا تغییر داده نمی‌شود.
*/

app.use(backend);

module.exports = app;
