// TON Dropy - Vercel Express entry point
// Admin panel routing
// سایر APIها و قابلیت‌های اصلی توسط server.js مدیریت می‌شوند.
const express = require("express");
const path = require("path");
const backend = require("./server.js");
const app = express();
/*
========================================================
ADMIN PANEL
========================================================
/admin و /admin/ مستقیماً public/admin.html را نمایش می‌دهند.
این بخش قبل از server.js قرار دارد تا route قدیمی
پنل مدیریت با پنل جدید تداخل نداشته باشد.
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
تمام routeهای قبلی بدون تغییر به server.js منتقل می‌شوند.
از جمله:
/api/health
/api/test-db
/api/auth/telegram
/api/upload-receipt
/api/admin/receipts-v2
/api/admin/review
و سایر APIهای موجود.
*/
app.use(backend);
/*
========================================================
VERCEL EXPORT
========================================================
*/
module.exports = app;
