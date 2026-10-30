const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// ======================================================
// CONFIG
// ======================================================

const TELEGRAM_BOT_TOKEN = "8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk";
const TELEGRAM_CHAT_ID = "5972276401";
const ADMIN_SECRET = "TondropyAdmin2026";

// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL = "https://vqddirelnxiklannquuu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HKt6R2jtn5e59R5K8fI9wnQ_tFEm-TJ5";

const supabaseHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
  Prefer: "return=representation"
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));

// ======================================================
// HELPERS
// ======================================================

function errorInfo(error) {
  return {
    message: error?.message || "Unknown error",
    status: error?.response?.status || null,
    details: error?.response?.data || null
  };
}

function safeJson(res, status, data) {
  return res.status(status).json(data);
}

// ======================================================
// TELEGRAM WEB APP VERIFY
// ======================================================

function verifyTelegramWebAppData(initData) {
  try {
    if (!initData) return false;

    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash");

    if (!receivedHash) return false;

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(function(a, b) {
        return a[0].localeCompare(b[0]);
      })
      .map(function(pair) {
        return pair[0] + "=" + pair[1];
      })
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const received = Buffer.from(receivedHash, "hex");
    const calculated = Buffer.from(calculatedHash, "hex");

    if (received.length !== calculated.length) {
      return false;
    }

    return crypto.timingSafeEqual(received, calculated);

  } catch (error) {
    console.error("TELEGRAM VERIFY ERROR:", error);
    return false;
  }
}

// ======================================================
// DATABASE HELPERS
// ======================================================

async function getUserByTelegramId(telegramId) {
  const response = await axios.get(
    SUPABASE_URL +
      "/rest/v1/users?telegram_id=eq." +
      encodeURIComponent(telegramId) +
      "&select=*",
    {
      headers: supabaseHeaders(),
      timeout: 10000
    }
  );

  return response.data?.[0] || null;
}

async function getUserById(userId) {
  const response = await axios.get(
    SUPABASE_URL +
      "/rest/v1/users?id=eq." +
      encodeURIComponent(userId) +
      "&select=*",
    {
      headers: supabaseHeaders(),
      timeout: 10000
    }
  );

  return response.data?.[0] || null;
}

// ======================================================
// MINI APP HTML
// ======================================================

const userHtml = String.raw`<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
>

<title>TON Dropy</title>

<script src="https://telegram.org/js/telegram-web-app.js"></script>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,
body{
  margin:0;
  padding:0;
  min-height:100%;
}

body{
  font-family:Vazirmatn,system-ui,sans-serif;
  color:#0b1220;
  background:
    radial-gradient(
      circle at 10% 0%,
      #e7f2ff,
      transparent 35%
    ),
    radial-gradient(
      circle at 90% 100%,
      #eef8ff,
      transparent 35%
    ),
    #f5f8fc;
}

#app{
  width:100%;
  max-width:480px;
  margin:auto;
  padding:18px 14px 40px;
}

.card{
  background:rgba(255,255,255,.88);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.95);
  border-radius:26px;
  padding:22px;
  margin-bottom:14px;
  box-shadow:0 8px 30px rgba(0,0,0,.05);
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

h1{
  font-size:23px;
  color:#0a84ff;
  margin:0;
  font-weight:900;
}

.muted{
  color:#64748b;
  font-size:13px;
}

.status{
  padding:7px 12px;
  border-radius:18px;
  font-size:12px;
  font-weight:800;
}

.title{
  font-size:19px;
  font-weight:900;
  margin-bottom:14px;
}

.amount{
  font-size:30px;
  font-weight:900;
  color:#0a84ff;
}

button{
  width:100%;
  border:0;
  border-radius:17px;
  padding:15px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
  margin-top:10px;
}

button:disabled{
  opacity:.55;
}

.primary{
  background:#0a84ff;
  color:#fff;
}

.green{
  background:#22c55e;
  color:#fff;
}

.red{
  background:#ef4444;
  color:#fff;
}

.light{
  background:#eef6ff;
  color:#0066cc;
}

.methods{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.method{
  padding:16px;
  border:2px solid transparent;
  border-radius:18px;
  background:#f8fafc;
  text-align:center;
  font-weight:800;
}

.method.active{
  border-color:#0a84ff;
  background:#eff6ff;
}

.upload{
  display:block;
  border:2px dashed #a8cdfc;
  border-radius:18px;
  padding:28px;
  text-align:center;
  color:#0a84ff;
  cursor:pointer;
}

input[type=file]{
  display:none;
}

.preview{
  width:100%;
  max-height:260px;
  object-fit:contain;
  border-radius:14px;
  margin-top:12px;
  background:#f8fafc;
}

.hidden{
  display:none !important;
}

.blocked{
  border:2px solid #ef4444;
  text-align:center;
}

.blocked .big{
  font-size:52px;
}

.activeBox{
  border:2px solid #22c55e;
  text-align:center;
}

.pendingBox{
  border:2px solid #f59e0b;
  text-align:center;
}

</style>

</head>

<body>

<div id="app">

<div class="card header">

<div>

<h1>TON Dropy</h1>

<div class="muted">
فعال‌سازی حساب
</div>

</div>

<div
  id="status"
  class="status"
  style="background:#fee2e2;color:#ef4444"
>
فعال نشده
</div>

</div>


<div
  id="loading"
  class="card"
  style="text-align:center"
>
در حال ارتباط...
</div>


<div
  id="error"
  class="card hidden"
  style="color:#b91c1c;text-align:center"
></div>


<!-- BLOCKED -->

<div
  id="blocked"
  class="card blocked hidden"
>

<div class="big">
🚫
</div>

<div
  class="title"
  style="color:#ef4444"
>
حساب شما مسدود شده است
</div>

<div class="muted">
دسترسی شما به TON Dropy مسدود شده است.
</div>

</div>


<!-- INACTIVE -->

<div
  id="inactive"
  class="hidden"
>

<div class="card">

<div>
سلام
<b id="name"></b>
عزیز 👋
</div>

<div
  class="muted"
  style="margin-top:7px"
>
برای استفاده، حساب خود را فعال کنید.
</div>

</div>


<div
  class="card"
  style="text-align:center"
>

<div class="muted">
هزینه فعال‌سازی
</div>

<div class="amount">
۳,۷۸۰,۰۰۰
<span style="font-size:15px">
تومان
</span>
</div>

<div class="muted">
معادل ۱۴ دلار
</div>

</div>


<div class="card">

<div class="title">
روش پرداخت
</div>

<div class="methods">

<div
  id="full"
  class="method active"
  onclick="setMethod('full')"
>
کامل
<br>
<span style="color:#0a84ff">
۳,۷۸۰,۰۰۰
</span>
</div>

<div
  id="installment"
  class="method"
  onclick="setMethod('installment')"
>
اقساطی
<br>
<span style="color:#0a84ff">
۹۴۵,۰۰۰
</span>
</div>

</div>

</div>


<div class="card">

<div class="title">
کارت به کارت
</div>

<div class="muted">
بانک شهر — نیما اسفندیاری
</div>

<div
  style="
    font-size:22px;
    font-weight:900;
    margin:12px 0;
    direction:ltr;
  "
>
5047061674676966
</div>

<button
  class="light"
  onclick="copyCard()"
>
کپی شماره کارت
</button>

<div
  style="
    margin-top:14px;
    text-align:center;
  "
>

<div class="muted">
مبلغ قابل پرداخت
</div>

<div
  id="dynamicAmount"
  class="amount"
>
۳,۷۸۰,۰۰۰
</div>

</div>

</div>


<div class="card">

<div class="title">
ارسال رسید
</div>

<label
  class="upload"
  id="uploadBox"
>

📎
<br>

<b>
انتخاب عکس رسید
</b>

<input
  id="file"
  type="file"
  accept="image/*"
  onchange="handleFile(event)"
>

</label>


<img
  id="preview"
  class="preview hidden"
>


<div
  id="fileName"
  class="muted"
  style="margin-top:8px"
></div>


<button
  id="removeBtn"
  class="red hidden"
  onclick="removeReceipt()"
>
حذف رسید
</button>


<button
  id="sendBtn"
  class="primary"
  onclick="uploadReceipt()"
>
ارسال رسید
</button>

</div>

</div>


<!-- PENDING -->

<div
  id="pending"
  class="card pendingBox hidden"
>

<div style="font-size:50px">
⏳
</div>

<div
  class="title"
  style="color:#f59e0b"
>
در انتظار تأیید
</div>

<div class="muted">
رسید شما توسط مدیریت بررسی می‌شود.
</div>

</div>


<!-- ACTIVE -->

<div
  id="active"
  class="card activeBox hidden"
>

<div style="font-size:50px">
✅
</div>

<div
  class="title"
  style="color:#22c55e"
>
حساب شما فعال است
</div>

<div class="muted">
به TON Dropy خوش آمدید.
</div>

</div>

</div>


<script>

var tg = window.Telegram && window.Telegram.WebApp;

var initData = "";
var currentUser = null;
var currentMethod = "full";
var receiptBase64 = "";
var pollingTimer = null;

function $(id){
  return document.getElementById(id);
}

function showOnly(id){

  [
    "inactive",
    "pending",
    "active",
    "blocked"
  ].forEach(function(item){
    $(item).classList.add("hidden");
  });

  if(id){
    $(id).classList.remove("hidden");
  }
}

function setStatus(text,color,bg){

  $("status").textContent = text;
  $("status").style.color = color;
  $("status").style.background = bg;

}

function showError(message){

  $("loading").classList.add("hidden");

  $("error").textContent = message;

  $("error").classList.remove("hidden");

}

function renderUser(user){

  currentUser = user;

  $("loading").classList.add("hidden");

  $("name").textContent =
    user.name || "کاربر";

  if(user.status === "blocked"){

    showOnly("blocked");

    setStatus(
      "مسدود",
      "#ef4444",
      "#fee2e2"
    );

    return;
  }

  if(user.status === "active"){

    showOnly("active");

    setStatus(
      "فعال",
      "#16a34a",
      "#dcfce7"
    );

    return;
  }

  if(user.status === "pending"){

    showOnly("pending");

    setStatus(
      "در انتظار",
      "#d97706",
      "#fef3c7"
    );

    return;
  }

  showOnly("inactive");

  setStatus(
    "فعال نشده",
    "#ef4444",
    "#fee2e2"
  );
}

async function authenticate(){

  try{

    var response = await fetch(
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

    var data = await response.json();

    if(!response.ok || !data.success){

      showError(
        data.message ||
        "احراز هویت ناموفق بود."
      );

      return;
    }

    renderUser(data.user);

    startPolling();

  }catch(error){

    console.error(error);

    showError(
      "خطا در ارتباط با سرور."
    );
  }
}

async function refreshStatus(){

  if(!initData) return;

  try{

    var response = await fetch(
      "/api/user/status",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        cache:"no-store",
        body:JSON.stringify({
          initData:initData
        })
      }
    );

    var data = await response.json();

    if(response.ok && data.success){

      renderUser(data.user);
    }

  }catch(error){

    console.error(
      "STATUS POLLING ERROR:",
      error
    );
  }
}

function startPolling(){

  if(pollingTimer){
    clearInterval(pollingTimer);
  }

  pollingTimer = setInterval(
    refreshStatus,
    5000
  );
}

function setMethod(method){

  currentMethod = method;

  $("full").classList.remove("active");
  $("installment").classList.remove("active");

  if(method === "full"){

    $("full").classList.add("active");

    $("dynamicAmount").textContent =
      "۳,۷۸۰,۰۰۰";

  }else{

    $("installment").classList.add("active");

    $("dynamicAmount").textContent =
      "۹۴۵,۰۰۰";
  }
}

async function copyCard(){

  try{

    await navigator.clipboard.writeText(
      "5047061674676966"
    );

    alert("شماره کارت کپی شد.");

  }catch(error){

    alert(
      "کپی خودکار انجام نشد."
    );
  }
}

function handleFile(event){

  var file =
    event.target.files &&
    event.target.files[0];

  if(!file) return;

  if(!file.type.startsWith("image/")){

    alert(
      "فقط فایل تصویری انتخاب کنید."
    );

    return;
  }

  if(file.size > 3000000){

    alert(
      "حجم عکس نباید بیشتر از ۳ مگابایت باشد."
    );

    return;
  }

  var reader = new FileReader();

  reader.onload = function(e){

    receiptBase64 = e.target.result;

    $("preview").src =
      receiptBase64;

    $("preview").classList.remove(
      "hidden"
    );

    $("fileName").textContent =
      file.name;

    $("uploadBox").classList.add(
      "hidden"
    );

    $("removeBtn").classList.remove(
      "hidden"
    );
  };

  reader.readAsDataURL(file);
}

function removeReceipt(){

  receiptBase64 = "";

  $("file").value = "";

  $("preview").src = "";

  $("preview").classList.add(
    "hidden"
  );

  $("fileName").textContent = "";

  $("uploadBox").classList.remove(
    "hidden"
  );

  $("removeBtn").classList.add(
    "hidden"
  );
}

async function uploadReceipt(){

  if(!currentUser){

    alert(
      "اطلاعات کاربر هنوز آماده نیست."
    );

    return;
  }

  if(!receiptBase64){

    alert(
      "ابتدا عکس رسید را انتخاب کنید."
    );

    return;
  }

  var button =
    $("sendBtn");

  button.disabled = true;

  button.textContent =
    "در حال ارسال...";

  try{

    var amount =
      currentMethod === "full"
        ? "3780000"
        : "945000";

    var response =
      await fetch(
        "/api/upload-receipt",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({

            telegramId:
              currentUser.telegram_id,

            userId:
              currentUser.id,

            username:
              currentUser.username,

            method:
              currentMethod,

            amount:
              amount,

            imageBase64:
              receiptBase64
          })
        }
      );

    var data =
      await response.json();

    if(!response.ok || !data.success){

      alert(
        data.message ||
        data.error ||
        "ارسال رسید ناموفق بود."
      );

      button.disabled = false;

      button.textContent =
        "ارسال رسید";

      return;
    }

    showOnly("pending");

    setStatus(
      "در انتظار",
      "#d97706",
      "#fef3c7"
    );

    button.disabled = false;

    button.textContent =
      "ارسال رسید";

    startPolling();

  }catch(error){

    console.error(error);

    alert(
      "خطا در ارتباط با سرور."
    );

    button.disabled = false;

    button.textContent =
      "ارسال رسید";
  }
}

async function boot(){

  if(!tg){

    showError(
      "این برنامه باید از داخل ربات Telegram باز شود."
    );

    return;
  }

  try{

    tg.ready();
    tg.expand();

  }catch(error){
    console.error(error);
  }

  initData =
    tg.initData || "";

  if(!initData){

    showError(
      "اطلاعات Telegram دریافت نشد. Mini App را از داخل ربات باز کنید."
    );

    return;
  }

  await authenticate();
}

boot();

</script>

</body>
</html>`;

// ======================================================
// ADMIN HTML
// ======================================================

const adminHtml = String.raw`<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>پنل مدیریت TON Dropy</title>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  padding:20px;
  background:#f4f7fb;
  color:#0b1220;
  font-family:Vazirmatn,system-ui,sans-serif;
}

.container{
  max-width:700px;
  margin:auto;
}

.header{
  background:linear-gradient(
    135deg,
    #0a84ff,
    #0066cc
  );
  color:#fff;
  border-radius:24px;
  padding:24px;
  margin-bottom:18px;
  box-shadow:0 12px 30px rgba(10,132,255,.2);
}

.header h1{
  margin:0 0 6px;
  font-size:24px;
}

.header p{
  margin:0;
  opacity:.9;
  font-size:13px;
}

.toolbar{
  display:flex;
  gap:10px;
  margin-top:18px;
}

.toolbar button{
  flex:1;
}

.card{
  background:#fff;
  border-radius:22px;
  padding:20px;
  margin-bottom:16px;
  box-shadow:0 5px 20px rgba(0,0,0,.05);
  border:1px solid #e8edf3;
}

.receipt-card{
  border-top:5px solid #0a84ff;
}

.row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:9px 0;
  border-bottom:1px solid #f0f2f5;
}

.row:last-child{
  border-bottom:0;
}

.label{
  color:#64748b;
  font-size:13px;
}

.value{
  font-weight:800;
  text-align:left;
  word-break:break-word;
}

.receipt-image{
  display:block;
  width:100%;
  max-height:600px;
  object-fit:contain;
  border-radius:16px;
  margin-top:16px;
  background:#f5f7fa;
  border:1px solid #e5e7eb;
}

.buttons{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:16px;
}

.buttons button{
  border:0;
  border-radius:15px;
  padding:15px 10px;
  color:#fff;
  font-family:inherit;
  font-size:15px;
  font-weight:900;
  cursor:pointer;
}

.approve{
  background:#22c55e;
}

.reject{
  background:#ef4444;
}

.block{
  background:#111827;
}

.unblock{
  background:#0284c7;
}

button:disabled{
  opacity:.5;
  cursor:not-allowed;
}

.status{
  display:inline-block;
  padding:6px 11px;
  border-radius:20px;
  font-size:12px;
  font-weight:900;
}

.status.pending{
  color:#b45309;
  background:#fef3c7;
}

.empty{
  text-align:center;
  padding:35px 20px;
  color:#64748b;
}

.error{
  color:#b91c1c;
  background:#fef2f2;
  border-color:#fecaca;
  white-space:pre-wrap;
  word-break:break-word;
}

.loading{
  text-align:center;
  padding:30px;
}

.info{
  color:#0369a1;
  background:#eff6ff;
  border:1px solid #bfdbfe;
}

@media(max-width:520px){

  body{
    padding:12px;
  }

  .buttons{
    grid-template-columns:1fr;
  }

}

</style>

</head>

<body>

<div class="container">

<div class="header">

<h1>
پنل مدیریت TON Dropy
</h1>

<p>
مدیریت رسیدها، تأیید پرداخت و وضعیت کاربران
</p>

<div class="toolbar">

<button
  onclick="loadReceipts()"
  style="
    border:0;
    border-radius:14px;
    padding:13px;
    font-family:inherit;
    font-weight:900;
    background:#fff;
    color:#0066cc;
  "
>
🔄 بروزرسانی رسیدها
</button>

</div>

</div>

<div
  id="summary"
  class="card info"
>
در حال دریافت اطلاعات...
</div>

<div id="list">
<div class="card loading">
در حال دریافت رسیدها...
</div>
</div>

</div>

<script>

var params =
  new URLSearchParams(
    window.location.search
  );

var secret =
  params.get("secret");

var list =
  document.getElementById("list");

var summary =
  document.getElementById("summary");

if(secret !== "TondropyAdmin2026"){

  list.innerHTML =
    '<div class="card error">دسترسی غیرمجاز!</div>';

  summary.textContent =
    "Secret نامعتبر است.";

}else{

  loadReceipts();
}

function escapeHtml(value){

  return String(value == null ? "" : value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function formatAmount(value){

  var number =
    Number(value || 0);

  if(!Number.isFinite(number)){
    return escapeHtml(value);
  }

  return number.toLocaleString("fa-IR");
}

function methodName(method){

  if(method === "installment"){
    return "اقساطی";
  }

  return "کامل";
}

function setLoading(){

  list.innerHTML =
    '<div class="card loading">' +
    '⏳ در حال دریافت رسیدها...' +
    '</div>';

  summary.textContent =
    "در حال دریافت اطلاعات...";
}

async function fetchWithTimeout(
  url,
  options,
  timeout
){

  var controller =
    new AbortController();

  var timer =
    setTimeout(
      function(){
        controller.abort();
      },
      timeout || 15000
    );

  try{

    var finalOptions =
      options || {};

    finalOptions.signal =
      controller.signal;

    return await fetch(
      url,
      finalOptions
    );

  }finally{

    clearTimeout(timer);
  }
}

async function loadReceipts(){

  if(secret !== "TondropyAdmin2026"){
    return;
  }

  setLoading();

  try{

    var response =
      await fetchWithTimeout(
        "/api/admin/receipts-v2?secret=" +
        encodeURIComponent(secret),
        {
          method:"GET",
          cache:"no-store",
          headers:{
            "Accept":"application/json"
          }
        },
        15000
      );

    var text =
      await response.text();

    var data;

    try{
      data = JSON.parse(text);
    }catch(parseError){

      throw new Error(
        "پاسخ سرور JSON معتبر نیست.\n\n" +
        text.substring(0,1000)
      );
    }

    if(!response.ok){

      throw new Error(
        data.error ||
        data.message ||
        "HTTP " + response.status
      );
    }

    if(!Array.isArray(data)){

      throw new Error(
        "ساختار پاسخ سرور نامعتبر است."
      );
    }

    summary.innerHTML =
      "🧾 تعداد رسیدهای در انتظار: <b>" +
      data.length +
      "</b>";

    if(data.length === 0){

      list.innerHTML =
        '<div class="card empty">' +
        '✅ در حال حاضر هیچ رسیدی در انتظار بررسی نیست.' +
        '</div>';

      return;
    }

    list.innerHTML = "";

    data.forEach(
      function(item){
        renderReceipt(item);
      }
    );

  }catch(error){

    console.error(
      "LOAD RECEIPTS ERROR:",
      error
    );

    summary.textContent =
      "خطا در دریافت اطلاعات.";

    list.innerHTML =
      '<div class="card error">' +
      '❌ خطا در دریافت رسیدها\n\n' +
      escapeHtml(
        error.name === "AbortError"
          ? "زمان پاسخ سرور تمام شد."
          : error.message
      ) +
      '</div>';
  }
}

function renderReceipt(item){

  var card =
    document.createElement("div");

  card.className =
    "card receipt-card";

  card.id =
    "receipt-" + item.id;

  var user =
    item.users || {};

  var username =
    user.username ||
    item.username ||
    "ناشناس";

  var telegramId =
    user.telegram_id ||
    item.telegram_id ||
    "نامشخص";

  var imageHtml = "";

  if(item.image_url){

    imageHtml =
      '<img ' +
      'class="receipt-image" ' +
      'src="' +
      escapeHtml(item.image_url) +
      '" ' +
      'alt="رسید پرداخت">';
  }

  card.innerHTML =

    '<div class="row">' +
      '<span class="label">کاربر</span>' +
      '<span class="value">@' +
      escapeHtml(username) +
      '</span>' +
    '</div>' +

    '<div class="row">' +
      '<span class="label">Telegram ID</span>' +
      '<span class="value">' +
      escapeHtml(telegramId) +
      '</span>' +
    '</div>' +

    '<div class="row">' +
      '<span class="label">مبلغ</span>' +
      '<span class="value">' +
      formatAmount(item.amount) +
      ' تومان</span>' +
    '</div>' +

    '<div class="row">' +
      '<span class="label">روش پرداخت</span>' +
      '<span class="value">' +
      methodName(item.method) +
      '</span>' +
    '</div>' +

    '<div class="row">' +
      '<span class="label">شناسه رسید</span>' +
      '<span class="value">' +
      escapeHtml(item.id) +
      '</span>' +
    '</div>' +

    '<div class="row">' +
      '<span class="label">وضعیت</span>' +
      '<span class="status pending">در انتظار</span>' +
    '</div>' +

    imageHtml +

    '<div class="buttons">' +

      '<button ' +
        'class="approve" ' +
        'onclick="reviewReceipt(\'' +
        escapeJs(item.id) +
        '\',\'' +
        escapeJs(item.user_id) +
        '\',\'approve\',this)">' +
        '✅ تأیید پرداخت' +
      '</button>' +

      '<button ' +
        'class="reject" ' +
        'onclick="reviewReceipt(\'' +
        escapeJs(item.id) +
        '\',\'' +
        escapeJs(item.user_id) +
        '\',\'reject\',this)">' +
        '❌ رد رسید' +
      '</button>' +

      '<button ' +
        'class="block" ' +
        'onclick="userAction(\'' +
        escapeJs(item.user_id) +
        '\',\'block\',this)">' +
        '🚫 مسدودی کاربر' +
      '</button>' +

      '<button ' +
        'class="unblock" ' +
        'onclick="userAction(\'' +
        escapeJs(item.user_id) +
        '\',\'unblock\',this)">' +
        '🔓 رفع مسدودی' +
      '</button>' +

    '</div>';

  list.appendChild(card);
}

function escapeJs(value){

  return String(value == null ? "" : value)
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\r/g,"\\r")
    .replace(/\n/g,"\\n");
}

async function reviewReceipt(
  receiptId,
  userId,
  action,
  button
){

  var message =
    action === "approve"
      ? "آیا از تأیید این پرداخت مطمئن هستید؟\\n\\nبعد از تأیید، حساب کاربر فعال می‌شود."
      : "آیا این رسید رد شود؟\\n\\nکاربر دوباره به صفحه پرداخت برمی‌گردد.";

  if(!confirm(message)){
    return;
  }

  button.disabled = true;
  button.textContent =
    "در حال انجام...";

  try{

    var response =
      await fetchWithTimeout(
        "/api/admin/review",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json",
            "Accept":
              "application/json"
          },
          body:JSON.stringify({

            receiptId:
              receiptId,

            userId:
              userId,

            action:
              action,

            secret:
              secret
          })
        },
        15000
      );

    var text =
      await response.text();

    var data;

    try{
      data = JSON.parse(text);
    }catch(error){

      throw new Error(
        "پاسخ نامعتبر سرور:\n" +
        text.substring(0,500)
      );
    }

    if(!response.ok || !data.success){

      throw new Error(
        data.error ||
        data.message ||
        "عملیات ناموفق بود."
      );
    }

    alert(
      action === "approve"
        ? "✅ پرداخت تأیید شد و حساب کاربر فعال شد."
        : "❌ رسید رد شد و حساب کاربر به حالت فعال‌نشده برگشت."
    );

    var card =
      document.getElementById(
        "receipt-" + receiptId
      );

    if(card){
      card.remove();
    }

    loadReceipts();

  }catch(error){

    console.error(
      "REVIEW ERROR:",
      error
    );

    alert(
      "❌ عملیات انجام نشد.\n\n" +
      error.message
    );

    button.disabled = false;

    button.textContent =
      action === "approve"
        ? "✅ تأیید پرداخت"
        : "❌ رد رسید";
  }
}

async function userAction(
  userId,
  action,
  button
){

  var message =
    action === "block"
      ? "آیا این کاربر مسدود شود؟\\n\\nکاربر در Mini App پیام «حساب شما مسدود شده است» خواهد دید."
      : "آیا مسدودی این کاربر برداشته شود؟\\n\\nکاربر به صفحه اصلی فعال‌سازی برمی‌گردد.";

  if(!confirm(message)){
    return;
  }

  button.disabled = true;

  button.textContent =
    "در حال انجام...";

  try{

    var response =
      await fetchWithTimeout(
        "/api/admin/user-status",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json",
            "Accept":
              "application/json"
          },
          body:JSON.stringify({

            userId:
              userId,

            action:
              action,

            secret:
              secret
          })
        },
        15000
      );

    var text =
      await response.text();

    var data;

    try{
      data = JSON.parse(text);
    }catch(error){

      throw new Error(
        "پاسخ نامعتبر سرور:\n" +
        text.substring(0,500)
      );
    }

    if(!response.ok || !data.success){

      throw new Error(
        data.error ||
        data.message ||
        "عملیات ناموفق بود."
      );
    }

    alert(
      action === "block"
        ? "🚫 کاربر با موفقیت مسدود شد."
        : "🔓 مسدودی کاربر برداشته شد."
    );

    loadReceipts();

  }catch(error){

    console.error(
      "USER ACTION ERROR:",
      error
    );

    alert(
      "❌ عملیات انجام نشد.\n\n" +
      error.message
    );

    button.disabled = false;

    button.textContent =
      action === "block"
        ? "🚫 مسدودی کاربر"
        : "🔓 رفع مسدودی";
  }
}

</script>

</body>
</html>`;

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  function(req, res) {

    res.json({
      success:true,
      service:"TON Dropy backend",
      status:"online",
      time:new Date().toISOString()
    });

  }
);

// ======================================================
// TEST DATABASE
// ======================================================

app.get(
  "/api/test-db",
  async function(req, res) {

    try {

      var response =
        await axios.get(
          SUPABASE_URL +
          "/rest/v1/users?select=id,telegram_id,username&limit=1",
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      return res.json({
        success:true,
        message:"اتصال به دیتابیس موفق بود",
        data:response.data
      });

    } catch(error) {

      console.error(
        "TEST DB ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          error:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// TELEGRAM AUTH
// ======================================================

app.post(
  "/api/auth/telegram",
  async function(req, res) {

    try {

      var initData =
        req.body?.initData;

      if(!initData){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"initData ارسال نشده است."
          }
        );
      }

      if(!verifyTelegramWebAppData(initData)){

        return safeJson(
          res,
          401,
          {
            success:false,
            message:"اطلاعات Telegram نامعتبر است."
          }
        );
      }

      var params =
        new URLSearchParams(initData);

      var userString =
        params.get("user");

      if(!userString){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"اطلاعات کاربر Telegram وجود ندارد."
          }
        );
      }

      var tgUser =
        JSON.parse(userString);

      var user =
        await getUserByTelegramId(
          tgUser.id
        );

      if(!user){

        var insert =
          await axios.post(
            SUPABASE_URL + "/rest/v1/users",
            {
              telegram_id:tgUser.id,
              first_name:tgUser.first_name || "",
              username:tgUser.username || "user",
              account_status:"inactive"
            },
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        user =
          insert.data?.[0] || null;

      }else{

        await axios.patch(
          SUPABASE_URL +
          "/rest/v1/users?id=eq." +
          encodeURIComponent(user.id),
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
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

        user =
          await getUserById(user.id);
      }

      if(!user){

        throw new Error(
          "کاربر در Supabase ساخته یا دریافت نشد."
        );
      }

      return res.json({

        success:true,

        user:{
          id:user.id,

          telegram_id:
            tgUser.id,

          name:
            tgUser.first_name ||
            user.first_name ||
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
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          message:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// USER STATUS
// ======================================================

app.post(
  "/api/user/status",
  async function(req, res) {

    try {

      var initData =
        req.body?.initData;

      if(!initData){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"initData ارسال نشده است."
          }
        );
      }

      if(!verifyTelegramWebAppData(initData)){

        return safeJson(
          res,
          401,
          {
            success:false,
            message:"اطلاعات Telegram نامعتبر است."
          }
        );
      }

      var params =
        new URLSearchParams(initData);

      var userString =
        params.get("user");

      if(!userString){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"کاربر Telegram پیدا نشد."
          }
        );
      }

      var tgUser =
        JSON.parse(userString);

      var user =
        await getUserByTelegramId(
          tgUser.id
        );

      if(!user){

        return safeJson(
          res,
          404,
          {
            success:false,
            message:"کاربر در دیتابیس پیدا نشد."
          }
        );
      }

      return res.json({

        success:true,

        user:{
          id:user.id,

          telegram_id:
            user.telegram_id,

          name:
            tgUser.first_name ||
            user.first_name ||
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
        "USER STATUS ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          message:error.message
        }
      );
    }

  }
);

// ======================================================
// UPLOAD RECEIPT
// ======================================================

app.post(
  "/api/upload-receipt",
  async function(req, res) {

    try {

      var telegramId =
        req.body?.telegramId;

      var userId =
        req.body?.userId;

      var username =
        req.body?.username;

      var amount =
        req.body?.amount;

      var method =
        req.body?.method;

      var imageBase64 =
        req.body?.imageBase64;

      if(
        !imageBase64 ||
        !amount ||
        !method
      ){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"اطلاعات رسید ناقص است."
          }
        );
      }

      if(
        !["full","installment"].includes(method)
      ){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"روش پرداخت نامعتبر است."
          }
        );
      }

      var numericAmount =
        parseInt(amount,10);

      if(
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"مبلغ نامعتبر است."
          }
        );
      }

      if(imageBase64.length > 5000000){

        return safeJson(
          res,
          400,
          {
            success:false,
            message:"حجم عکس زیاد است."
          }
        );
      }

      var user = null;

      if(telegramId){

        user =
          await getUserByTelegramId(
            telegramId
          );
      }

      if(!user && userId){

        user =
          await getUserById(
            userId
          );
      }

      if(!user && username){

        var byUsername =
          await axios.get(
            SUPABASE_URL +
            "/rest/v1/users?username=eq." +
            encodeURIComponent(username) +
            "&select=*",
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        user =
          byUsername.data?.[0] || null;
      }

      if(!user){

        return safeJson(
          res,
          404,
          {
            success:false,
            message:"کاربر در دیتابیس پیدا نشد."
          }
        );
      }

      // کاربر مسدود اجازه ارسال رسید ندارد
      if(user.account_status === "blocked"){

        return safeJson(
          res,
          403,
          {
            success:false,
            blocked:true,
            message:"حساب شما مسدود شده است."
          }
        );
      }

      // حساب فعال دوباره نباید رسید ارسال کند
      if(user.account_status === "active"){

        return safeJson(
          res,
          409,
          {
            success:false,
            message:"حساب شما قبلاً فعال شده است."
          }
        );
      }

      // جلوگیری از رسید pending تکراری
      var duplicate =
        await axios.get(
          SUPABASE_URL +
          "/rest/v1/receipts?user_id=eq." +
          encodeURIComponent(user.id) +
          "&status=eq.pending&select=id&limit=1",
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      if(
        Array.isArray(duplicate.data) &&
        duplicate.data.length > 0
      ){

        return safeJson(
          res,
          409,
          {
            success:false,
            message:"برای این حساب یک رسید در انتظار بررسی وجود دارد."
          }
        );
      }

      // ثبت رسید
      var receiptInsert =
        await axios.post(
          SUPABASE_URL + "/rest/v1/receipts",
          {
            user_id:user.id,
            amount:numericAmount,
            method:method,
            status:"pending"
          },
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      var receipt =
        receiptInsert.data?.[0];

      if(!receipt){

        throw new Error(
          "رسید در Supabase ثبت نشد."
        );
      }

      // تغییر وضعیت کاربر به pending
      await axios.patch(
        SUPABASE_URL +
        "/rest/v1/users?id=eq." +
        encodeURIComponent(user.id),
        {
          account_status:"pending"
        },
        {
          headers:supabaseHeaders(),
          timeout:10000
        }
      );

      // آماده‌سازی تصویر
      var base64Data =
        imageBase64.replace(
          /^data:image\/[^;]+;base64,/,
          ""
        );

      var buffer =
        Buffer.from(
          base64Data,
          "base64"
        );

      // ارسال به Telegram
      var FormDataClass =
        globalThis.FormData;

      var BlobClass =
        globalThis.Blob;

      if(!FormDataClass || !BlobClass){

        throw new Error(
          "Node.js 18 یا بالاتر مورد نیاز است."
        );
      }

      var formData =
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

      var telegramResponse =
        await fetch(
          "https://api.telegram.org/bot" +
          TELEGRAM_BOT_TOKEN +
          "/sendPhoto",
          {
            method:"POST",
            body:formData
          }
        );

      var telegramData =
        await telegramResponse.json();

      if(!telegramData.ok){

        console.error(
          "TELEGRAM SEND ERROR:",
          telegramData
        );

        return safeJson(
          res,
          502,
          {
            success:false,
            message:
              "رسید در دیتابیس ثبت شد اما ارسال تصویر به Telegram ناموفق بود.",
            telegram_error:
              telegramData.description ||
              "Telegram error",
            receipt_id:
              receipt.id
          }
        );
      }

      return res.json({

        success:true,

        message:
          "رسید با موفقیت ثبت شد.",

        receipt_id:
          receipt.id
      });

    }catch(error){

      console.error(
        "UPLOAD RECEIPT ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          message:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// ADMIN RECEIPTS
// ======================================================

app.get(
  "/api/admin/receipts-v2",
  async function(req, res) {

    if(req.query.secret !== ADMIN_SECRET){

      return safeJson(
        res,
        403,
        {
          success:false,
          error:"Forbidden"
        }
      );
    }

    try {

      var receiptsResponse =
        await axios.get(
          SUPABASE_URL +
          "/rest/v1/receipts?status=eq.pending&select=*&order=created_at.desc",
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      var receipts =
        Array.isArray(receiptsResponse.data)
          ? receiptsResponse.data
          : [];

      if(receipts.length === 0){

        return res.json([]);
      }

      var userIds =
        Array.from(
          new Set(
            receipts
              .map(function(item){
                return item.user_id;
              })
              .filter(Boolean)
          )
        );

      var users = [];

      if(userIds.length > 0){

        var orParts =
          userIds.map(function(id){
            return "id.eq." +
              encodeURIComponent(id);
          });

        var usersResponse =
          await axios.get(
            SUPABASE_URL +
            "/rest/v1/users?select=id,username,telegram_id,account_status&or=(" +
            orParts.join(",") +
            ")",
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        users =
          Array.isArray(usersResponse.data)
            ? usersResponse.data
            : [];
      }

      var result =
        receipts.map(function(receipt){

          var user =
            users.find(function(item){
              return String(item.id) ===
                String(receipt.user_id);
            });

          return {
            ...receipt,

            users:user
              ? {
                  username:user.username,
                  telegram_id:user.telegram_id,
                  account_status:user.account_status
                }
              : {
                  username:"ناشناس"
                }
          };

        });

      return res.json(result);

    }catch(error){

      console.error(
        "ADMIN RECEIPTS ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          error:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// ADMIN REVIEW
// ======================================================

app.post(
  "/api/admin/review",
  async function(req, res) {

    var receiptId =
      req.body?.receiptId;

    var userId =
      req.body?.userId;

    var action =
      req.body?.action;

    var secret =
      req.body?.secret;

    if(secret !== ADMIN_SECRET){

      return safeJson(
        res,
        403,
        {
          success:false,
          error:"Forbidden"
        }
      );
    }

    if(
      !receiptId ||
      !userId ||
      !["approve","reject"].includes(action)
    ){

      return safeJson(
        res,
        400,
        {
          success:false,
          error:"اطلاعات عملیات ناقص یا نامعتبر است."
        }
      );
    }

    try {

      // --------------------------------------------------
      // ابتدا رسید فعلی را می‌خوانیم
      // --------------------------------------------------

      var receiptResponse =
        await axios.get(
          SUPABASE_URL +
          "/rest/v1/receipts?id=eq." +
          encodeURIComponent(receiptId) +
          "&select=id,user_id,status&limit=1",
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      var receipt =
        receiptResponse.data?.[0];

      if(!receipt){

        return safeJson(
          res,
          404,
          {
            success:false,
            error:"رسید پیدا نشد."
          }
        );
      }

      if(
        String(receipt.user_id) !==
        String(userId)
      ){

        return safeJson(
          res,
          400,
          {
            success:false,
            error:"رسید متعلق به این کاربر نیست."
          }
        );
      }

      // جلوگیری از دوباره تأیید یا دوباره رد کردن
      if(receipt.status !== "pending"){

        return safeJson(
          res,
          409,
          {
            success:false,
            error:
              "این رسید قبلاً بررسی شده است.",
            current_status:
              receipt.status
          }
        );
      }

      // --------------------------------------------------
      // APPROVE
      // --------------------------------------------------

      if(action === "approve"){

        var approveResponse =
          await axios.patch(
            SUPABASE_URL +
            "/rest/v1/receipts?id=eq." +
            encodeURIComponent(receiptId) +
            "&status=eq.pending",
            {
              status:"approved"
            },
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        if(
          !Array.isArray(
            approveResponse.data
          ) ||
          approveResponse.data.length === 0
        ){

          return safeJson(
            res,
            409,
            {
              success:false,
              error:
                "این رسید قبلاً توسط مدیر دیگری بررسی شده است."
            }
          );
        }

        try {

          var userUpdate =
            await axios.patch(
              SUPABASE_URL +
              "/rest/v1/users?id=eq." +
              encodeURIComponent(userId),
              {
                account_status:"active"
              },
              {
                headers:supabaseHeaders(),
                timeout:10000
              }
            );

          if(
            !Array.isArray(
              userUpdate.data
            ) ||
            userUpdate.data.length === 0
          ){

            throw new Error(
              "کاربر برای فعال‌سازی پیدا نشد."
            );
          }

        }catch(userError){

          // Rollback رسید در صورت خطا
          try{

            await axios.patch(
              SUPABASE_URL +
              "/rest/v1/receipts?id=eq." +
              encodeURIComponent(receiptId) +
              "&status=eq.approved",
              {
                status:"pending"
              },
              {
                headers:supabaseHeaders(),
                timeout:10000
              }
            );

          }catch(rollbackError){

            console.error(
              "ROLLBACK ERROR:",
              errorInfo(rollbackError)
            );
          }

          throw userError;
        }

        return res.json({

          success:true,

          message:
            "پرداخت تأیید شد و حساب کاربر فعال شد.",

          receipt_status:
            "approved",

          user_status:
            "active"
        });
      }

      // --------------------------------------------------
      // REJECT
      // --------------------------------------------------

      if(action === "reject"){

        var rejectResponse =
          await axios.patch(
            SUPABASE_URL +
            "/rest/v1/receipts?id=eq." +
            encodeURIComponent(receiptId) +
            "&status=eq.pending",
            {
              status:"rejected"
            },
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        if(
          !Array.isArray(
            rejectResponse.data
          ) ||
          rejectResponse.data.length === 0
        ){

          return safeJson(
            res,
            409,
            {
              success:false,
              error:
                "این رسید قبلاً توسط مدیر دیگری بررسی شده است."
            }
          );
        }

        await axios.patch(
          SUPABASE_URL +
          "/rest/v1/users?id=eq." +
          encodeURIComponent(userId),
          {
            account_status:"inactive"
          },
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

        return res.json({

          success:true,

          message:
            "رسید رد شد و حساب کاربر به حالت فعال‌نشده برگشت.",

          receipt_status:
            "rejected",

          user_status:
            "inactive"
        });
      }

    }catch(error){

      console.error(
        "ADMIN REVIEW ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          error:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// ADMIN USER BLOCK / UNBLOCK
// ======================================================

app.post(
  "/api/admin/user-status",
  async function(req, res) {

    var userId =
      req.body?.userId;

    var action =
      req.body?.action;

    var secret =
      req.body?.secret;

    if(secret !== ADMIN_SECRET){

      return safeJson(
        res,
        403,
        {
          success:false,
          error:"Forbidden"
        }
      );
    }

    if(
      !userId ||
      !["block","unblock"].includes(action)
    ){

      return safeJson(
        res,
        400,
        {
          success:false,
          error:"اطلاعات عملیات نامعتبر است."
        }
      );
    }

    try {

      var newStatus =
        action === "block"
          ? "blocked"
          : "inactive";

      var updateResponse =
        await axios.patch(
          SUPABASE_URL +
          "/rest/v1/users?id=eq." +
          encodeURIComponent(userId),
          {
            account_status:newStatus
          },
          {
            headers:supabaseHeaders(),
            timeout:10000
          }
        );

      if(
        !Array.isArray(
          updateResponse.data
        ) ||
        updateResponse.data.length === 0
      ){

        return safeJson(
          res,
          404,
          {
            success:false,
            error:"کاربر پیدا نشد."
          }
        );
      }

      // اگر کاربر مسدود شد،
      // رسیدهای pending او دیگر قابل تأیید نیستند
      if(action === "block"){

        try{

          await axios.patch(
            SUPABASE_URL +
            "/rest/v1/receipts?user_id=eq." +
            encodeURIComponent(userId) +
            "&status=eq.pending",
            {
              status:"rejected"
            },
            {
              headers:supabaseHeaders(),
              timeout:10000
            }
          );

        }catch(receiptError){

          console.error(
            "BLOCK RECEIPT UPDATE ERROR:",
            errorInfo(receiptError)
          );
        }
      }

      return res.json({

        success:true,

        message:
          action === "block"
            ? "کاربر مسدود شد."
            : "مسدودی کاربر برداشته شد.",

        status:
          newStatus
      });

    }catch(error){

      console.error(
        "ADMIN USER STATUS ERROR:",
        errorInfo(error)
      );

      return safeJson(
        res,
        500,
        {
          success:false,
          error:error.message,
          status:error.response?.status || null,
          details:error.response?.data || null
        }
      );
    }

  }
);

// ======================================================
// ADMIN PAGE
// ======================================================

app.get(
  "/admin",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    return res.send(adminHtml);
  }
);

// ======================================================
// USER PAGE
// ======================================================

app.get(
  "/",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    return res.send(userHtml);
  }
);

// ======================================================
// 404 API HANDLER
// ======================================================

app.use(
  "/api",
  function(req, res) {

    return safeJson(
      res,
      404,
      {
        success:false,
        error:"API endpoint not found",
        path:req.path,
        method:req.method
      }
    );
  }
);

// ======================================================
// EXPORT FOR VERCEL
// ======================================================

module.exports = app;
