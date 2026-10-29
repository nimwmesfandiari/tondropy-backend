const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// ======================================================
// CONFIG — مقادیر اصلی حذف یا تغییر داده نشده‌اند
// ======================================================

const TELEGRAM_BOT_TOKEN = "8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk";
const TELEGRAM_CHAT_ID = "5972276401";
const ADMIN_SECRET = "TondropyAdmin2026";

// ======================================================
// SUPABASE — مقادیر اصلی حذف یا تغییر داده نشده‌اند
// ======================================================

const SUPABASE_URL = "https://vqddirelnxiklannquuu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HKtL2jtn5e59R5K8fI9wnQ_tFEm-TJ5";

const getSupabaseHeaders = () => ({
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));

// ======================================================
// TELEGRAM WEB APP HTML
// ======================================================

const userHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TON Dropy</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">

<style>
:root {
  --brand:#0A84FF;
  --brand-dark:#0066CC;
  --success:#22C55E;
  --warning:#F59E0B;
  --danger:#EF4444;
  --glass-bg:rgba(255,255,255,.65);
  --glass-border:rgba(255,255,255,.9);
  --text-main:#0B1220;
  --text-muted:#64748B;
}

* {
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,
body {
  margin:0;
  padding:0;
}

body {
  font-family:'Vazirmatn',system-ui,-apple-system,sans-serif;
  color:var(--text-main);
  min-height:100vh;
  background:
    radial-gradient(
      ellipse 60% 50% at 15% 0%,
      rgba(10,132,255,.1),
      transparent 60%
    ),
    radial-gradient(
      ellipse 55% 45% at 90% 100%,
      rgba(100,200,255,.08),
      transparent 60%
    ),
    #F8FAFC;
  background-attachment:fixed;
  overflow-x:hidden;
  direction:rtl;
}

#app {
  min-height:100vh;
  padding:20px 16px 40px;
  display:flex;
  justify-content:center;
}

.page-container {
  width:100%;
  max-width:480px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.glass-card {
  background:var(--glass-bg);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  border:1px solid var(--glass-border);
  box-shadow:
    0 8px 32px rgba(10,132,255,.06),
    0 2px 8px rgba(0,0,0,.02);
  border-radius:28px;
  padding:24px 20px;
  text-align:center;
  width:100%;
  animation:slideUp .4s cubic-bezier(.2,.9,.3,1.1) both;
}

.glass-card-blue {
  background:rgba(239,246,255,.8);
  border-color:rgba(10,132,255,.15);
}

.title-lg {
  font-size:22px;
  font-weight:900;
  color:var(--brand);
  margin:0;
}

.subtitle {
  font-size:13px;
  color:var(--text-muted);
  font-weight:500;
  margin-top:4px;
}

.label {
  font-size:12px;
  color:var(--text-muted);
  margin-bottom:6px;
}

.value-sm {
  font-size:14px;
  font-weight:700;
  color:var(--text-main);
}

.value-md {
  font-size:18px;
  font-weight:800;
  color:var(--text-main);
  margin-bottom:16px;
}

.value-lg {
  font-size:28px;
  font-weight:900;
  color:var(--text-main);
}

.value-blue {
  font-size:22px;
  font-weight:900;
  color:var(--brand);
}

button {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  width:100%;
  padding:16px;
  border:none;
  border-radius:18px;
  font-size:16px;
  font-weight:700;
  font-family:inherit;
  cursor:pointer;
  transition:all .2s ease;
  user-select:none;
}

.btn-primary {
  background:linear-gradient(
    135deg,
    var(--brand),
    var(--brand-dark)
  );
  color:#fff;
  box-shadow:0 8px 24px rgba(10,132,255,.3);
}

.btn-primary:active:not(:disabled) {
  transform:scale(.98);
}

.btn-primary:disabled {
  opacity:.6;
  cursor:not-allowed;
  box-shadow:none;
}

.btn-glass {
  background:rgba(255,255,255,.8);
  color:var(--brand-dark);
  border:1px solid rgba(10,132,255,.2);
  box-shadow:0 4px 12px rgba(10,132,255,.05);
}

.method-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-top:16px;
}

.method-card {
  background:rgba(255,255,255,.5);
  border:2px solid transparent;
  border-radius:20px;
  padding:20px 16px;
  cursor:pointer;
  transition:all .3s ease;
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:8px;
}

.method-card.active {
  background:rgba(239,246,255,.9);
  border-color:var(--brand);
  box-shadow:0 8px 24px rgba(10,132,255,.15);
}

.method-card .check-icon {
  position:absolute;
  top:12px;
  left:12px;
  width:20px;
  height:20px;
  background:var(--brand);
  color:#fff;
  border-radius:50%;
  display:grid;
  place-items:center;
  font-size:12px;
  opacity:0;
  transform:scale(.5);
  transition:all .2s;
}

.method-card.active .check-icon {
  opacity:1;
  transform:scale(1);
}

.amount-display {
  font-size:32px;
  font-weight:900;
  color:var(--brand);
  transition:all .3s;
}

.fade-transition {
  animation:fadeScale .3s ease;
}

@keyframes fadeScale {
  from {
    opacity:0;
    transform:scale(.95);
  }

  to {
    opacity:1;
    transform:scale(1);
  }
}

.upload-box {
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:32px 20px;
  border:2px dashed rgba(10,132,255,.3);
  border-radius:20px;
  background:rgba(255,255,255,.4);
  cursor:pointer;
  transition:all .2s;
  margin-top:16px;
}

.file-preview {
  margin-top:16px;
  padding:16px;
  background:rgba(255,255,255,.6);
  border-radius:16px;
  border:1px solid rgba(10,132,255,.1);
}

.file-preview img {
  width:100%;
  max-height:200px;
  object-fit:contain;
  border-radius:12px;
  margin-bottom:12px;
  background:#fff;
}

.hidden {
  display:none!important;
}

@keyframes slideUp {
  from {
    opacity:0;
    transform:translateY(20px);
  }

  to {
    opacity:1;
    transform:translateY(0);
  }
}
</style>
</head>

<body>

<div id="app">
<div class="page-container">

<div
  class="glass-card"
  style="
    padding:16px 20px;
    display:flex;
    justify-content:space-between;
    align-items:center;
  "
>

<div style="text-align:right">
<h1 class="title-lg">TON Dropy</h1>
<div class="subtitle">فعال‌سازی حساب</div>
</div>

<div
  id="status-badge"
  style="
    background:rgba(239,68,68,.1);
    color:#EF4444;
    padding:6px 12px;
    border-radius:20px;
    font-size:12px;
    font-weight:700;
    display:flex;
    align-items:center;
    gap:6px
  "
>

<div
  id="status-dot"
  style="
    width:8px;
    height:8px;
    border-radius:50%;
    background:#EF4444
  "
></div>

<span id="status-text">فعال نشده</span>

</div>
</div>

<div id="loading-section" class="glass-card">
<p>در حال ارتباط...</p>
</div>

<div id="error-section" class="glass-card hidden">

<p
  style="
    color:var(--danger);
    font-weight:bold;
    margin-bottom:8px
  "
>
خطا
</p>

<p
  id="error-message"
  style="
    font-size:13px;
    color:#333
  "
></p>

</div>

<div
  id="inactive-section"
  class="hidden"
  style="
    display:flex;
    flex-direction:column;
    gap:16px;
  "
>

<div
  class="glass-card"
  style="padding:16px"
>

<div class="value-sm">
سلام
<span
  id="userNameDisplay"
  style="color:var(--brand)"
></span>
عزیز 👋
</div>

<div
  class="label"
  style="margin-top:4px"
>
برای استفاده، حساب خود را فعال کنید.
</div>

</div>

<div
  class="glass-card glass-card-blue"
>

<div class="label">
هزینه فعال‌سازی
</div>

<div
  class="value-lg"
  style="margin:8px 0"
>
۱۴
<span style="font-size:16px">
دلار
</span>
</div>

<div
  class="value-sm"
  style="color:var(--brand)"
>
معادل ۳,۷۸۰,۰۰۰ تومان
</div>

</div>

<div class="glass-card">

<div class="value-md">
روش پرداخت
</div>

<div class="method-grid">

<div
  class="method-card active"
  id="m-full"
  onclick="setMethod('full')"
>

<div class="check-icon">
✓
</div>

<div class="value-sm">
کامل
</div>

<div
  class="value-blue"
  style="font-size:18px"
>
۳,۷۸۰,۰۰۰
</div>

</div>

<div
  class="method-card"
  id="m-inst"
  onclick="setMethod('installment')"
>

<div class="check-icon">
✓
</div>

<div class="value-sm">
اقساطی
</div>

<div
  class="value-blue"
  style="font-size:18px"
>
۹۴۵,۰۰۰
</div>

</div>

</div>
</div>

<div class="glass-card">

<div class="value-md">
کارت به کارت
</div>

<div
  style="
    background:rgba(255,255,255,.4);
    padding:16px;
    border-radius:16px;
    margin-bottom:16px
  "
>

<div
  style="
    display:flex;
    justify-content:space-between
  "
>

<span class="label">
بانک:
</span>

<span class="value-sm">
بانک شهر
</span>

</div>

<div
  style="
    display:flex;
    justify-content:space-between
  "
>

<span class="label">
صاحب حساب:
</span>

<span class="value-sm">
نیما اسفندیاری
</span>

</div>

<div
  style="
    display:flex;
    flex-direction:column;
    align-items:center;
    margin-top:8px
  "
>

<span class="label">
شماره کارت
</span>

<div
  style="
    font-size:22px;
    font-weight:900;
    direction:ltr;
    margin-top:4px
  "
>
5047061674676966
</div>

</div>
</div>

<button
  class="btn-glass"
  onclick="copyCard()"
>
کپی شماره کارت
</button>

<div
  style="
    margin-top:16px;
    background:rgba(10,132,255,.08);
    padding:16px;
    border-radius:16px
  "
>

<div class="label">
مبلغ قابل پرداخت
</div>

<div
  id="dynamic-amount"
  class="amount-display"
  style="margin-top:4px"
>
۳,۷۸۰,۰۰۰
<span style="font-size:16px">
تومان
</span>
</div>

<div
  id="amount-desc"
  class="label"
  style="margin-top:4px"
>
پرداخت یکجا
</div>

</div>
</div>

<div class="glass-card">

<div class="value-md">
ارسال رسید
</div>

<div
  id="upload-preview"
  class="hidden file-preview"
>

<img
  id="preview-img"
  src=""
  alt="رسید"
>

<div
  style="
    display:flex;
    justify-content:space-between;
    margin-bottom:12px
  "
>

<div>
<div
  id="file-name"
  class="value-sm"
  style="font-size:12px"
></div>
</div>

<button
  onclick="removeReceipt()"
  style="
    width:auto;
    padding:8px;
    background:rgba(239,68,68,.1);
    color:var(--danger);
    border-radius:8px;
    font-size:12px
  "
>
حذف
</button>

</div>

<button
  id="submit-btn"
  class="btn-primary"
  onclick="uploadReceipt()"
>
ارسال رسید
</button>

</div>

<div id="upload-box-container">

<label class="upload-box">

<div style="font-size:28px">
📎
</div>

<div
  style="
    font-size:14px;
    color:var(--brand)
  "
>
انتخاب عکس
</div>

<input
  type="file"
  id="receiptFile"
  accept="image/*"
  style="display:none"
  onchange="handleFile(event)"
>

</label>

</div>

</div>

</div>

<div
  id="pending-section"
  class="glass-card hidden"
>

<div
  style="
    font-size:48px;
    margin-bottom:12px
  "
>
⏳
</div>

<div
  class="value-md"
  style="color:var(--warning)"
>
در انتظار تأیید
</div>

<div
  class="label"
  style="margin-top:8px"
>
رسید شما بررسی می‌شود.
</div>

</div>

<div
  id="active-section"
  class="hidden"
  style="
    display:flex;
    flex-direction:column;
    gap:16px
  "
>

<div
  class="glass-card"
  style="border-color:var(--success)"
>

<div
  style="
    font-size:48px;
    margin-bottom:12px
  "
>
✅
</div>

<div
  class="value-md"
  style="color:var(--success)"
>
حساب شما فعال است
</div>

<div class="label">
به داشبورد خوش آمدید.
</div>

</div>

</div>

</div>
</div>

<script>

let currentMethod = "full";
let currentUsername = "";
let currentTelegramId = "";
let currentUserId = "";
let receiptBase64 = "";

window.onload = async function(){

  if(!window.Telegram || !window.Telegram.WebApp){
    return showError("اسکریپت تلگرام لود نشد.");
  }

  const tgWebApp = window.Telegram.WebApp;

  tgWebApp.ready();
  tgWebApp.expand();
  tgWebApp.enableClosingConfirmation();

  const initData = tgWebApp.initData;

  if(!initData){
    return showError("از ربات وارد شوید.");
  }

  try{

    const res = await fetch(
      "/api/auth/telegram",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          initData:initData
        })
      }
    );

    const data = await res.json();

    if(data.success){

      currentUsername = data.user.username || "user";
      currentTelegramId = String(
        data.user.telegram_id || ""
      );
      currentUserId = String(
        data.user.id || ""
      );

      document.getElementById(
        "userNameDisplay"
      ).innerText =
        data.user.name || "کاربر";

      document.getElementById(
        "loading-section"
      ).classList.add("hidden");

      if(data.user.status === "active"){

        document.getElementById(
          "active-section"
        ).classList.remove("hidden");

        setHeaderStatus(
          "فعال",
          "var(--success)",
          "rgba(34,197,94,.1)",
          "#22C55E"
        );

      }else if(data.user.status === "pending"){

        document.getElementById(
          "pending-section"
        ).classList.remove("hidden");

        setHeaderStatus(
          "در انتظار",
          "var(--warning)",
          "rgba(245,158,11,.1)",
          "#F59E0B"
        );

      }else{

        document.getElementById(
          "inactive-section"
        ).classList.remove("hidden");

      }

    }else{

      showError(
        data.message || "اطلاعات نامعتبر است."
      );

    }

  }catch(e){

    console.error(e);

    showError(
      "خطا در ارتباط با سرور."
    );

  }

};

function setHeaderStatus(
  text,
  textColor,
  bgColor,
  dotColor
){

  document.getElementById(
    "status-text"
  ).innerText = text;

  document.getElementById(
    "status-text"
  ).style.color = textColor;

  document.getElementById(
    "status-badge"
  ).style.background = bgColor;

  document.getElementById(
    "status-badge"
  ).style.color = textColor;

  document.getElementById(
    "status-dot"
  ).style.background = dotColor;

}

function showError(msg){

  document.getElementById(
    "loading-section"
  ).classList.add("hidden");

  document.getElementById(
    "error-section"
  ).classList.remove("hidden");

  document.getElementById(
    "error-message"
  ).innerText = msg;

}

function setMethod(method){

  currentMethod = method;

  document.getElementById(
    "m-full"
  ).classList.remove("active");

  document.getElementById(
    "m-inst"
  ).classList.remove("active");

  document.getElementById(
    "m-" + (
      method === "full"
      ? "full"
      : "inst"
    )
  ).classList.add("active");

  const amountEl =
    document.getElementById(
      "dynamic-amount"
    );

  amountEl.classList.remove(
    "fade-transition"
  );

  void amountEl.offsetWidth;

  amountEl.classList.add(
    "fade-transition"
  );

  if(method === "full"){

    amountEl.innerHTML =
      "۳,۷۸۰,۰۰۰ " +
      '<span style="font-size:16px">تومان</span>';

    document.getElementById(
      "amount-desc"
    ).innerText =
      "پرداخت یکجا";

  }else{

    amountEl.innerHTML =
      "۹۴۵,۰۰۰ " +
      '<span style="font-size:16px">تومان</span>';

    document.getElementById(
      "amount-desc"
    ).innerText =
      "قسط ۱ از ۴";

  }

}

async function copyCard(){

  try{

    await navigator.clipboard.writeText(
      "5047061674676966"
    );

    const button =
      event.currentTarget;

    button.innerText =
      "کپی شد ✓";

    setTimeout(
      () => button.innerText =
        "کپی شماره کارت",
      2000
    );

  }catch(e){

    alert(
      "کپی خودکار انجام نشد."
    );

  }

}

function handleFile(event){

  const file =
    event.target.files[0];

  if(!file)return;

  if(!file.type.startsWith("image/")){

    return alert(
      "فقط فایل تصویری انتخاب کنید."
    );

  }

  if(file.size > 3000000){

    return alert(
      "حجم عکس نباید بیشتر از ۳ مگابایت باشد."
    );

  }

  const reader =
    new FileReader();

  reader.onload =
    function(e){

      receiptBase64 =
        e.target.result;

      document.getElementById(
        "preview-img"
      ).src =
        receiptBase64;

      document.getElementById(
        "file-name"
      ).innerText =
        file.name;

      document.getElementById(
        "upload-box-container"
      ).classList.add("hidden");

      document.getElementById(
        "upload-preview"
      ).classList.remove("hidden");

    };

  reader.readAsDataURL(file);

}

function removeReceipt(){

  receiptBase64 = "";

  document.getElementById(
    "receiptFile"
  ).value = "";

  document.getElementById(
    "upload-box-container"
  ).classList.remove("hidden");

  document.getElementById(
    "upload-preview"
  ).classList.add("hidden");

}

async function uploadReceipt(){

  if(!receiptBase64){

    return alert(
      "ابتدا عکس رسید را انتخاب کنید."
    );

  }

  const btn =
    document.getElementById(
      "submit-btn"
    );

  btn.innerText =
    "در حال ارسال...";

  btn.disabled = true;

  try{

    const res = await fetch(
      "/api/upload-receipt",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({

          telegramId:
            currentTelegramId,

          userId:
            currentUserId,

          username:
            currentUsername,

          method:
            currentMethod,

          amount:
            currentMethod === "full"
              ? "3780000"
              : "945000",

          imageBase64:
            receiptBase64

        })
      }
    );

    const data =
      await res.json();

    if(data.success){

      document.getElementById(
        "inactive-section"
      ).classList.add("hidden");

      document.getElementById(
        "pending-section"
      ).classList.remove("hidden");

      setHeaderStatus(
        "در انتظار",
        "var(--warning)",
        "rgba(245,158,11,.1)",
        "#F59E0B"
      );

    }else{

      alert(
        "خطا: " +
        (
          data.message ||
          "ارسال رسید ناموفق بود."
        )
      );

      btn.innerText =
        "ارسال رسید";

      btn.disabled = false;

    }

  }catch(e){

    console.error(e);

    alert(
      "خطا در ارتباط با سرور."
    );

    btn.innerText =
      "ارسال رسید";

    btn.disabled = false;

  }

}

</script>

</body>
</html>`;

// ======================================================
// ADMIN HTML
// ======================================================

const adminHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1.0"
>

<title>
پنل مدیریت TON Dropy
</title>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

body{
  font-family:'Vazirmatn',sans-serif;
  background:#F8FAFC;
  margin:0;
  padding:20px;
  direction:rtl;
}

.card{
  background:#fff;
  border-radius:16px;
  padding:20px;
  margin-bottom:16px;
  box-shadow:
    0 4px 12px rgba(0,0,0,.05);
  border:1px solid #eee;
}

.title{
  color:#0A84FF;
  font-weight:900;
  font-size:20px;
  margin-bottom:20px;
  text-align:center;
}

.btn{
  padding:10px;
  border-radius:8px;
  border:none;
  font-family:inherit;
  font-weight:bold;
  cursor:pointer;
  width:100%;
  margin-top:10px;
}

.btn-approve{
  background:#22C55E;
  color:#fff;
}

.btn-reject{
  background:#EF4444;
  color:#fff;
}

.row{
  display:flex;
  justify-content:space-between;
  margin-bottom:8px;
  font-size:14px;
}

.receipt-img{
  width:100%;
  max-height:500px;
  object-fit:contain;
  border-radius:12px;
  background:#f5f5f5;
  margin-top:14px;
}

.error{
  color:#b91c1c;
  white-space:pre-wrap;
  word-break:break-word;
}

</style>

</head>

<body>

<div class="title">
پنل مدیریت TON Dropy (v7)
</div>

<div id="list">
در حال دریافت...
</div>

<script>

const secret =
  new URLSearchParams(
    window.location.search
  ).get("secret");

if(secret !== "TondropyAdmin2026"){

  document.getElementById(
    "list"
  ).innerHTML =
    '<div class="card" style="color:red;text-align:center">' +
    'دسترسی غیرمجاز!' +
    '</div>';

}else{

  loadReceipts();

}

function esc(value){

  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}

async function loadReceipts(){

  const list =
    document.getElementById(
      "list"
    );

  list.innerHTML =
    "در حال دریافت...";

  try{

    const res =
      await fetch(
        "/api/admin/receipts-v2?secret=" +
        encodeURIComponent(secret),
        {
          cache:"no-store"
        }
      );

    const data =
      await res.json();

    if(!res.ok){

      throw new Error(
        data.error ||
        ("HTTP " + res.status)
      );

    }

    list.innerHTML = "";

    if(
      !Array.isArray(data) ||
      data.length === 0
    ){

      list.innerHTML =
        '<div class="card" style="text-align:center">' +
        'رسیدی وجود ندارد.' +
        '</div>';

      return;

    }

    data.forEach(
      item => {

        const username =
          item.users?.username ||
          item.username ||
          "ناشناس";

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "card";

        card.id =
          "card-" + item.id;

        const imageHtml =
          item.image_url
            ? '<img class="receipt-img" src="' +
              esc(item.image_url) +
              '" alt="رسید">'
            : '<div style="margin-top:12px;color:#64748B;font-size:13px">' +
              'تصویر رسید در دیتابیس ذخیره نشده است؛ ' +
              'تصویر به Telegram ارسال شده است.' +
              '</div>';

        card.innerHTML =
          '<div class="row">' +
          '<span>کاربر:</span>' +
          '<b>@' +
          esc(username) +
          '</b>' +
          '</div>' +

          '<div class="row">' +
          '<span>مبلغ:</span>' +
          '<b>' +
          esc(item.amount) +
          ' تومان</b>' +
          '</div>' +

          '<div class="row">' +
          '<span>روش:</span>' +
          '<b>' +
          (
            item.method === "full"
              ? "کامل"
              : "اقساطی"
          ) +
          '</b>' +
          '</div>' +

          '<div class="row">' +
          '<span>وضعیت:</span>' +
          '<b>' +
          esc(item.status) +
          '</b>' +
          '</div>' +

          imageHtml +

          '<button class="btn btn-approve" data-action="approve">' +
          'تأیید' +
          '</button>' +

          '<button class="btn btn-reject" data-action="reject">' +
          'رد' +
          '</button>';

        card
          .querySelector(
            '[data-action="approve"]'
          )
          .addEventListener(
            "click",
            () =>
              review(
                item.id,
                item.user_id,
                "approve"
              )
          );

        card
          .querySelector(
            '[data-action="reject"]'
          )
          .addEventListener(
            "click",
            () =>
              review(
                item.id,
                item.user_id,
                "reject"
              )
          );

        list.appendChild(card);

      }
    );

  }catch(error){

    console.error(error);

    list.innerHTML =
      '<div class="card error">' +
      'خطا در ارتباط با سرور:\n' +
      esc(error.message) +
      '</div>';

  }

}

async function review(
  receiptId,
  userId,
  action
){

  if(
    !confirm(
      action === "approve"
        ? "آیا رسید تأیید شود؟"
        : "آیا رسید رد شود؟"
    )
  ){
    return;
  }

  try{

    const res =
      await fetch(
        "/api/admin/review",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            receiptId,
            userId,
            action,
            secret
          })
        }
      );

    const data =
      await res.json();

    if(
      !res.ok ||
      !data.success
    ){

      alert(
        data.error ||
        data.message ||
        "عملیات ناموفق بود."
      );

      return;

    }

    const card =
      document.getElementById(
        "card-" + receiptId
      );

    if(card){
      card.remove();
    }

  }catch(error){

    console.error(error);

    alert(
      "خطا در ارتباط با سرور."
    );

  }

}

</script>

</body>
</html>`;

// ======================================================
// HELPERS
// ======================================================

function supabaseError(error){

  return {

    message:
      error?.message ||
      "Unknown error",

    status:
      error?.response?.status ||
      null,

    data:
      error?.response?.data ||
      null

  };

}

// ======================================================
// TELEGRAM INIT DATA VERIFY
// ======================================================

function verifyTelegramWebAppData(
  telegramInitData
){

  try{

    const initData =
      new URLSearchParams(
        telegramInitData
      );

    const hash =
      initData.get("hash");

    if(!hash){
      return false;
    }

    initData.delete("hash");

    const dataCheckString =
      Array.from(
        initData.entries()
      )
      .sort(
        ([a],[b]) =>
          a.localeCompare(b)
      )
      .map(
        ([key,value]) =>
          `${key}=${value}`
      )
      .join("\n");

    const secretKey =
      crypto
        .createHmac(
          "sha256",
          "WebAppData"
        )
        .update(
          TELEGRAM_BOT_TOKEN
        )
        .digest();

    const calculatedHash =
      crypto
        .createHmac(
          "sha256",
          secretKey
        )
        .update(
          dataCheckString
        )
        .digest("hex");

    const received =
      Buffer.from(
        hash,
        "hex"
      );

    const calculated =
      Buffer.from(
        calculatedHash,
        "hex"
      );

    if(
      received.length !==
      calculated.length
    ){
      return false;
    }

    return crypto.timingSafeEqual(
      calculated,
      received
    );

  }catch(error){

    console.error(
      "Telegram verification error:",
      error
    );

    return false;

  }

}

// ======================================================
// TEST DATABASE
// ======================================================

app.get(
  "/api/test-db",
  async(req,res)=>{

    try{

      const response =
        await axios.get(

          `${SUPABASE_URL}/rest/v1/users?select=id,telegram_id,username&limit=1`,

          {
            headers:
              getSupabaseHeaders(),

            timeout:
              10000
          }

        );

      res.json({

        success:true,

        message:
          "اتصال به دیتابیس موفق بود",

        data:
          response.data

      });

    }catch(error){

      console.error(
        "TEST DB ERROR:",
        supabaseError(error)
      );

      res.status(500).json({

        success:false,

        error:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null

      });

    }

  }
);

// ======================================================
// ADMIN RECEIPTS
// ======================================================

app.get(
  "/api/admin/receipts-v2",
  async(req,res)=>{

    if(
      req.query.secret !==
      ADMIN_SECRET
    ){

      return res.status(403).json({
        error:"Forbidden"
      });

    }

    try{

      const receiptsRes =
        await axios.get(

          `${SUPABASE_URL}/rest/v1/receipts?status=eq.pending&select=*`,

          {
            headers:
              getSupabaseHeaders(),

            timeout:
              10000
          }

        );

      const receipts =
        Array.isArray(
          receiptsRes.data
        )
          ? receiptsRes.data
          : [];

      if(
        receipts.length === 0
      ){

        return res.json([]);

      }

      const userIds =
        [
          ...new Set(
            receipts
              .map(
                r => r.user_id
              )
              .filter(Boolean)
          )
        ];

      let users = [];

      if(userIds.length){

        const orQuery =
          userIds
            .map(
              id =>
                `id.eq.${encodeURIComponent(id)}`
            )
            .join(",");

        const usersRes =
          await axios.get(

            `${SUPABASE_URL}/rest/v1/users?select=id,username,telegram_id&or=(${orQuery})`,

            {
              headers:
                getSupabaseHeaders(),

              timeout:
                10000
            }

          );

        users =
          Array.isArray(
            usersRes.data
          )
            ? usersRes.data
            : [];

      }

      const result =
        receipts.map(
          receipt => {

            const user =
              users.find(
                u =>
                  String(u.id) ===
                  String(
                    receipt.user_id
                  )
              );

            return {

              ...receipt,

              users:
                user
                  ? {
                      username:
                        user.username,
                      telegram_id:
                        user.telegram_id
                    }
                  : {
                      username:
                        "ناشناس"
                    }

            };

          }
        );

      return res.json(
        result
      );

    }catch(error){

      console.error(
        "ADMIN RECEIPTS ERROR:",
        supabaseError(error)
      );

      return res.status(500).json({

        error:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null

      });

    }

  }
);

// ======================================================
// PAGES
// ======================================================

app.get(
  "/",
  (req,res)=>{

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    res.send(
      userHtml
    );

  }
);

app.get(
  "/admin",
  (req,res)=>{

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    res.send(
      adminHtml
    );

  }
);

// ======================================================
// TELEGRAM AUTH
// ======================================================

app.post(
  "/api/auth/telegram",
  async(req,res)=>{

    try{

      const {
        initData
      } = req.body;

      if(!initData){

        return res.status(400).json({

          success:false,

          message:
            "initData ارسال نشده است."

        });

      }

      if(
        !verifyTelegramWebAppData(
          initData
        )
      ){

        return res.status(401).json({

          success:false,

          message:
            "اطلاعات Telegram نامعتبر است."

        });

      }

      const params =
        new URLSearchParams(
          initData
        );

      const userString =
        params.get(
          "user"
        );

      if(!userString){

        return res.status(400).json({

          success:false,

          message:
            "اطلاعات کاربر Telegram وجود ندارد."

        });

      }

      const tgUser =
        JSON.parse(
          userString
        );

      const checkRes =
        await axios.get(

          `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(tgUser.id)}&select=*`,

          {
            headers:
              getSupabaseHeaders(),

            timeout:
              10000
          }

        );

      let user =
        checkRes.data?.length > 0
          ? checkRes.data[0]
          : null;

      if(!user){

        const insertRes =
          await axios.post(

            `${SUPABASE_URL}/rest/v1/users`,

            {

              telegram_id:
                tgUser.id,

              first_name:
                tgUser.first_name ||
                "",

              username:
                tgUser.username ||
                "user",

              account_status:
                "inactive"

            },

            {

              headers:
                getSupabaseHeaders(),

              timeout:
                10000

            }

          );

        user =
          insertRes.data?.[0];

        if(!user){

          throw new Error(
            "کاربر در Supabase ساخته نشد."
          );

        }

      }else{

        await axios.patch(

          `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`,

          {

            first_name:
              tgUser.first_name ||
              user.first_name ||
              "",

            username:
              tgUser.username ||
              user.username ||
              "user"

          },

          {

            headers:
              getSupabaseHeaders(),

            timeout:
              10000

          }

        );

      }

      return res.json({

        success:true,

        user:{

          id:
            user.id,

          telegram_id:
            tgUser.id,

          name:
            tgUser.first_name ||
            "کاربر",

          username:
            tgUser.username ||
            user.username ||
            "user",

          status:
            user.account_status ||
            "inactive"

        }

      });

    }catch(error){

      console.error(
        "AUTH ERROR:",
        supabaseError(error)
      );

      return res.status(500).json({

        success:false,

        message:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null

      });

    }

  }
);

// ======================================================
// UPLOAD RECEIPT
// ======================================================

app.post(
  "/api/upload-receipt",
  async(req,res)=>{

    try{

      const {

        telegramId,
        userId,
        username,
        amount,
        method,
        imageBase64

      } = req.body;

      if(
        !imageBase64 ||
        !amount ||
        !method
      ){

        return res.status(400).json({

          success:false,

          message:
            "اطلاعات رسید ناقص است."

        });

      }

      if(
        !["full","installment"]
          .includes(method)
      ){

        return res.status(400).json({

          success:false,

          message:
            "روش پرداخت نامعتبر است."

        });

      }

      const numericAmount =
        parseInt(
          amount,
          10
        );

      if(
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ){

        return res.status(400).json({

          success:false,

          message:
            "مبلغ نامعتبر است."

        });

      }

      if(
        imageBase64.length >
        5000000
      ){

        return res.status(400).json({

          success:false,

          message:
            "حجم عکس زیاد است."

        });

      }

      // ------------------------------------------
      // پیدا کردن کاربر بر اساس Telegram ID
      // ------------------------------------------

      let user = null;

      if(telegramId){

        const userRes =
          await axios.get(

            `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(telegramId)}&select=id,telegram_id,username,account_status`,

            {

              headers:
                getSupabaseHeaders(),

              timeout:
                10000

            }

          );

        user =
          userRes.data?.[0] ||
          null;

      }

      // fallback برای سازگاری
      // با نسخه قبلی

      if(!user && userId){

        const userRes =
          await axios.get(

            `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id,telegram_id,username,account_status`,

            {

              headers:
                getSupabaseHeaders(),

              timeout:
                10000

            }

          );

        user =
          userRes.data?.[0] ||
          null;

      }

      if(!user && username){

        const userRes =
          await axios.get(

            `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=id,telegram_id,username,account_status`,

            {

              headers:
                getSupabaseHeaders(),

              timeout:
                10000

            }

          );

        user =
          userRes.data?.[0] ||
          null;

      }

      if(!user){

        return res.status(404).json({

          success:false,

          message:
            "کاربر در دیتابیس پیدا نشد."

        });

      }

      // ------------------------------------------
      // جلوگیری از ثبت رسید تکراری
      // ------------------------------------------

      const duplicateRes =
        await axios.get(

          `${SUPABASE_URL}/rest/v1/receipts?user_id=eq.${encodeURIComponent(user.id)}&status=eq.pending&select=id&limit=1`,

          {

            headers:
              getSupabaseHeaders(),

            timeout:
              10000

          }

        );

      if(
        Array.isArray(
          duplicateRes.data
        ) &&
        duplicateRes.data.length > 0
      ){

        return res.status(409).json({

          success:false,

          message:
            "برای این حساب یک رسید در انتظار بررسی وجود دارد."

        });

      }

      // ------------------------------------------
      // ثبت رسید در Supabase
      // ------------------------------------------

      const receiptInsert =
        await axios.post(

          `${SUPABASE_URL}/rest/v1/receipts`,

          {

            user_id:
              user.id,

            amount:
              numericAmount,

            method:
              method,

            status:
              "pending"

          },

          {

            headers:
              getSupabaseHeaders(),

            timeout:
              10000

          }

        );

      const receipt =
        receiptInsert.data?.[0];

      if(!receipt){

        throw new Error(
          "رسید در Supabase ثبت نشد."
        );

      }

      // ------------------------------------------
      // تغییر وضعیت کاربر
      // ------------------------------------------

      await axios.patch(

        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`,

        {

          account_status:
            "pending"

        },

        {

          headers:
            getSupabaseHeaders(),

          timeout:
            10000

        }

      );

      // ------------------------------------------
      // ارسال عکس رسید به Telegram
      // ------------------------------------------

      const base64Data =
        imageBase64.replace(
          /^data:image\/[^;]+;base64,/,
          ""
        );

      const buffer =
        Buffer.from(
          base64Data,
          "base64"
        );

      const FormDataClass =
        globalThis.FormData;

      const BlobClass =
        globalThis.Blob;

      if(
        !FormDataClass ||
        !BlobClass
      ){

        throw new Error(
          "نسخه Node.js باید 18 یا بالاتر باشد."
        );

      }

      const formData =
        new FormDataClass();

      formData.append(
        "chat_id",
        TELEGRAM_CHAT_ID
      );

      formData.append(
        "caption",

        "🧾 رسید جدید\n" +
        "👤 کاربر: @" +
        (
          user.username ||
          username ||
          "user"
        ) +
        "\n" +
        "🆔 Telegram ID: " +
        (
          user.telegram_id ||
          telegramId ||
          ""
        ) +
        "\n" +
        "💰 مبلغ: " +
        numericAmount +
        " تومان\n" +
        "💳 روش: " +
        (
          method === "full"
            ? "کامل"
            : "اقساطی"
        ) +
        "\n" +
        "🆔 Receipt ID: " +
        receipt.id
      );

      formData.append(

        "photo",

        new BlobClass(
          [buffer],
          {
            type:"image/jpeg"
          }
        ),

        "receipt.jpg"

      );

      const telegramResponse =
        await fetch(

          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,

          {

            method:"POST",

            body:
              formData

          }

        );

      const tgData =
        await telegramResponse.json();

      if(!tgData.ok){

        console.error(
          "TELEGRAM SEND ERROR:",
          tgData
        );

        return res.status(502).json({

          success:false,

          message:
            "رسید در دیتابیس ثبت شد اما ارسال تصویر به Telegram ناموفق بود.",

          telegram_error:
            tgData.description ||
            "Telegram error",

          receipt_id:
            receipt.id

        });

      }

      return res.json({

        success:true,

        message:
          "رسید با موفقیت ثبت و برای مدیریت ارسال شد.",

        receipt_id:
          receipt.id

      });

    }catch(error){

      console.error(
        "UPLOAD RECEIPT ERROR:",
        supabaseError(error)
      );

      return res.status(500).json({

        success:false,

        message:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null

      });

    }

  }
);

// ======================================================
// ADMIN REVIEW
// ======================================================

app.post(
  "/api/admin/review",
  async(req,res)=>{

    const {
      receiptId,
      userId,
      action,
      secret
    } = req.body;

    if(
      secret !==
      ADMIN_SECRET
    ){

      return res.status(403).json({
        error:"Forbidden"
      });

    }

    if(
      !receiptId ||
      !userId ||
      !["approve","reject"]
        .includes(action)
    ){

      return res.status(400).json({

        success:false,

        error:
          "اطلاعات عملیات ناقص یا نامعتبر است."

      });

    }

    try{

      const receiptStatus =
        action === "approve"
          ? "approved"
          : "rejected";

      const userStatus =
        action === "approve"
          ? "active"
          : "inactive";

      await axios.patch(

        `${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(receiptId)}`,

        {
          status:
            receiptStatus
        },

        {

          headers:
            getSupabaseHeaders(),

          timeout:
            10000

        }

      );

      await axios.patch(

        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,

        {

          account_status:
            userStatus

        },

        {

          headers:
            getSupabaseHeaders(),

          timeout:
            10000

        }

      );

      return res.json({

        success:true,

        message:
          action === "approve"
            ? "رسید تأیید شد."
            : "رسید رد شد."

      });

    }catch(error){

      console.error(
        "ADMIN REVIEW ERROR:",
        supabaseError(error)
      );

      return res.status(500).json({

        success:false,

        error:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null

      });

    }

  }
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  "/api/health",
  (req,res)=>{

    res.json({

      success:true,

      service:
        "TON Dropy backend",

      status:
        "online",

      time:
        new Date().toISOString()

    });

  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = app;
