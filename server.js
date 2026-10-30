const express=require("express");
const cors=require("cors");
const crypto=require("crypto");
const axios=require("axios");
const app=express();

// ================= CONFIG =================
const TELEGRAM_BOT_TOKEN="8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk";
const TELEGRAM_CHAT_ID="5972276401";
const ADMIN_SECRET="TondropyAdmin2026";

const SUPABASE_URL="https://vqddirelnxiklannquuu.supabase.co";
const SUPABASE_KEY="sb_publishable_HKt6R2jtn5e59R5K8fI9wnQ_tFEm-TJ5";

app.use(cors());
app.use(express.json({limit:"15mb"}));

const headers=()=>({
  apikey:SUPABASE_KEY,
  Authorization:`Bearer ${SUPABASE_KEY}`,
  "Content-Type":"application/json",
  Prefer:"return=representation"
});

const errInfo=e=>({
  message:e?.message||"Unknown error",
  status:e?.response?.status||null,
  details:e?.response?.data||null
});

// ================= TELEGRAM VERIFY =================

function verifyTelegram(initData){
  try{
    const p=new URLSearchParams(initData);
    const hash=p.get("hash");

    if(!hash)return false;

    p.delete("hash");

    const check=[...p.entries()]
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([k,v])=>`${k}=${v}`)
      .join("\n");

    const key=crypto
      .createHmac("sha256","WebAppData")
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const calculated=crypto
      .createHmac("sha256",key)
      .update(check)
      .digest("hex");

    const a=Buffer.from(hash,"hex");
    const b=Buffer.from(calculated,"hex");

    return a.length===b.length &&
      crypto.timingSafeEqual(a,b);

  }catch(e){
    console.error("TG VERIFY",e);
    return false;
  }
}

// ================= DATABASE HELPERS =================

async function userById(id){

  const r=await axios.get(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      headers:headers(),
      timeout:10000
    }
  );

  return r.data?.[0]||null;
}

async function userByTelegram(id){

  const r=await axios.get(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(id)}&select=*`,
    {
      headers:headers(),
      timeout:10000
    }
  );

  return r.data?.[0]||null;
}

// ======================================================
// MINI APP
// ======================================================

const userHtml=`<!doctype html>
<html lang="fa" dir="rtl">

<head>

<meta charset="utf-8">

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
  -webkit-tap-highlight-color:transparent
}

body{
  margin:0;
  min-height:100vh;
  font-family:Vazirmatn,system-ui,sans-serif;
  color:#0b1220;
  background:
    radial-gradient(
      circle at 10% 0%,
      #e8f3ff,
      transparent 35%
    ),
    #f5f8fc
}

#app{
  max-width:480px;
  margin:auto;
  padding:18px 14px 40px
}

.card{
  background:rgba(255,255,255,.86);
  backdrop-filter:blur(20px);
  border:1px solid #fff;
  border-radius:26px;
  padding:22px;
  margin-bottom:14px;
  box-shadow:0 8px 30px rgba(0,0,0,.05)
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:center
}

h1{
  font-size:23px;
  color:#0a84ff;
  margin:0;
  font-weight:900
}

.muted{
  color:#64748b;
  font-size:13px
}

.status{
  padding:7px 12px;
  border-radius:18px;
  font-size:12px;
  font-weight:800
}

.title{
  font-size:19px;
  font-weight:900;
  margin-bottom:14px
}

.amount{
  font-size:30px;
  font-weight:900;
  color:#0a84ff
}

button{
  width:100%;
  border:0;
  border-radius:17px;
  padding:15px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
  margin-top:10px
}

.primary{
  background:#0a84ff;
  color:#fff
}

.red{
  background:#ef4444;
  color:#fff
}

.light{
  background:#eef6ff;
  color:#0066cc
}

.methods{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px
}

.method{
  padding:16px;
  border:2px solid transparent;
  border-radius:18px;
  background:#f8fafc;
  text-align:center;
  font-weight:800
}

.method.active{
  border-color:#0a84ff;
  background:#eff6ff
}

.upload{
  display:block;
  border:2px dashed #a8cdfc;
  border-radius:18px;
  padding:28px;
  text-align:center;
  color:#0a84ff;
  cursor:pointer
}

input[type=file]{
  display:none
}

.preview{
  width:100%;
  max-height:240px;
  object-fit:contain;
  border-radius:14px;
  margin-top:12px
}

.hidden{
  display:none!important
}

.blocked{
  border:2px solid #ef4444;
  text-align:center
}

.blocked .big{
  font-size:52px
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
دسترسی شما به Mini App مسدود شده است.
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
<small style="font-size:15px">
تومان
</small>
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
    direction:ltr
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
    text-align:center
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
  class="card hidden"
  style="text-align:center"
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
رسید شما بررسی می‌شود.
</div>

</div>


<!-- ACTIVE -->

<div
  id="active"
  class="card hidden"
  style="
    text-align:center;
    border:2px solid #22c55e
  "
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

let initData="";
let currentUser=null;
let currentMethod="full";
let receiptBase64="";

const $=id=>document.getElementById(id);


function showOnly(id){

  [
    "inactive",
    "pending",
    "active",
    "blocked"
  ].forEach(
    x=>$(x).classList.add("hidden")
  );

  if(id){
    $(id).classList.remove("hidden");
  }

}


function status(text,color,bg){

  $("status").textContent=text;

  $("status").style.color=color;

  $("status").style.background=bg;

}


function showError(message){

  $("loading").classList.add("hidden");

  $("error").textContent=message;

  $("error").classList.remove("hidden");

}


function renderUser(user){

  currentUser=user;

  $("loading").classList.add("hidden");

  $("name").textContent=
    user.name||"کاربر";


  if(user.status==="blocked"){

    showOnly("blocked");

    status(
      "مسدود",
      "#ef4444",
      "#fee2e2"
    );

  }

  else if(user.status==="active"){

    showOnly("active");

    status(
      "فعال",
      "#16a34a",
      "#dcfce7"
    );

  }

  else if(user.status==="pending"){

    showOnly("pending");

    status(
      "در انتظار",
      "#d97706",
      "#fef3c7"
    );

  }

  else{

    showOnly("inactive");

    status(
      "فعال نشده",
      "#ef4444",
      "#fee2e2"
    );

  }

}


async function auth(){

  try{

    const r=await fetch(
      "/api/auth/telegram",
      {
        method:"POST",
        headers:{
          "Content-Type":
            "application/json"
        },
        body:JSON.stringify({
          initData
        })
      }
    );

    const d=await r.json();

    if(
      !r.ok ||
      !d.success
    ){

      return showError(
        d.message||
        "احراز هویت ناموفق بود."
      );

    }

    renderUser(d.user);

  }catch(e){

    showError(
      "خطا در ارتباط با سرور."
    );

  }

}


async function poll(){

  if(!initData)return;

  try{

    const r=await fetch(
      "/api/user/status",
      {
        method:"POST",
        headers:{
          "Content-Type":
            "application/json"
        },
        body:JSON.stringify({
          initData
        })
      }
    );

    const d=await r.json();

    if(
      r.ok &&
      d.success
    ){

      renderUser(d.user);

    }

  }catch(e){}

}


function setMethod(method){

  currentMethod=method;

  $("full").classList.toggle(
    "active",
    method==="full"
  );

  $("installment").classList.toggle(
    "active",
    method!=="full"
  );

  $("dynamicAmount").textContent=
    method==="full"
      ?"۳,۷۸۰,۰۰۰"
      :"۹۴۵,۰۰۰";

}


async function copyCard(){

  try{

    await navigator.clipboard.writeText(
      "5047061674676966"
    );

    alert(
      "شماره کارت کپی شد."
    );

  }catch(e){

    alert(
      "کپی خودکار انجام نشد."
    );

  }

}


function handleFile(e){

  const f=e.target.files[0];

  if(!f)return;

  if(
    !f.type.startsWith("image/")
  ){

    return alert(
      "فقط عکس انتخاب کنید."
    );

  }

  if(f.size>3000000){

    return alert(
      "حجم عکس نباید بیشتر از ۳ مگابایت باشد."
    );

  }

  const rd=new FileReader();

  rd.onload=x=>{

    receiptBase64=x.target.result;

    $("preview").src=
      receiptBase64;

    $("preview")
      .classList
      .remove("hidden");

    $("removeBtn")
      .classList
      .remove("hidden");

    $("uploadBox")
      .classList
      .add("hidden");

    $("fileName").textContent=
      f.name;

  };

  rd.readAsDataURL(f);

}


function removeReceipt(){

  receiptBase64="";

  $("file").value="";

  $("preview")
    .classList
    .add("hidden");

  $("removeBtn")
    .classList
    .add("hidden");

  $("uploadBox")
    .classList
    .remove("hidden");

  $("fileName").textContent="";

}


async function uploadReceipt(){

  if(!receiptBase64){

    return alert(
      "ابتدا عکس رسید را انتخاب کنید."
    );

  }

  const b=$("sendBtn");

  b.disabled=true;

  b.textContent=
    "در حال ارسال...";


  try{

    const r=await fetch(
      "/api/upload-receipt",
      {
        method:"POST",
        headers:{
          "Content-Type":
            "application/json"
        },
        body:JSON.stringify({

          initData,

          telegramId:
            currentUser.telegram_id,

          userId:
            currentUser.id,

          username:
            currentUser.username,

          method:
            currentMethod,

          amount:
            currentMethod==="full"
              ?"3780000"
              :"945000",

          imageBase64:
            receiptBase64

        })
      }
    );

    const d=await r.json();

    if(
      !r.ok ||
      !d.success
    ){

      alert(
        d.message||
        d.error||
        "ارسال رسید ناموفق بود."
      );

      b.disabled=false;

      b.textContent=
        "ارسال رسید";

      return;

    }

    renderUser(
      Object.assign(
        {},
        currentUser,
        {
          status:"pending"
        }
      )
    );

  }catch(e){

    alert(
      "خطا در ارتباط با سرور."
    );

    b.disabled=false;

    b.textContent=
      "ارسال رسید";

  }

}


window.addEventListener(
  "load",
  async()=>{

    if(
      !window.Telegram?.WebApp
    ){

      return showError(
        "اسکریپت Telegram WebApp لود نشد."
      );

    }

    const tg=
      Telegram.WebApp;

    tg.ready();

    tg.expand();

    initData=
      tg.initData;

    if(!initData){

      return showError(
        "از داخل ربات وارد Mini App شوید."
      );

    }

    await auth();

    setInterval(
      poll,
      5000
    );

  }
);

</script>

</body>
</html>`;

// ======================================================
// ADMIN PANEL
// ======================================================

const adminHtml=`<!doctype html>
<html lang="fa" dir="rtl">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
پنل مدیریت TON Dropy
</title>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

*{
  box-sizing:border-box
}

body{
  margin:0;
  padding:18px;
  font-family:Vazirmatn,sans-serif;
  background:#f3f6fb;
  color:#0b1220
}

.wrap{
  max-width:850px;
  margin:auto
}

.head,
.card,
.stat{
  background:#fff;
  border-radius:24px;
  padding:20px;
  margin-bottom:16px;
  box-shadow:0 8px 25px #0000000a
}

.head{
  display:flex;
  gap:10px;
  justify-content:space-between;
  align-items:center
}

.head h1{
  margin:0;
  color:#0a84ff;
  font-size:22px
}

.stats{
  display:grid;
  grid-template-columns:
    repeat(3,1fr);
  gap:10px
}

.stat{
  text-align:center
}

.stat b{
  display:block;
  font-size:25px
}

.stat span{
  font-size:12px;
  color:#64748b
}

.receipt{
  border:1px solid #e5e7eb;
  border-radius:20px;
  padding:16px;
  margin-top:12px
}

.row{
  display:flex;
  justify-content:space-between;
  gap:10px;
  margin:8px 0
}

.badge{
  padding:6px 10px;
  border-radius:15px;
  background:#fff7ed;
  color:#c2410c;
  font-size:12px;
  font-weight:800
}

.btn{
  border:0;
  border-radius:15px;
  padding:14px;
  width:100%;
  font:inherit;
  font-weight:900;
  margin-top:9px;
  cursor:pointer
}

.approve{
  background:#22c55e;
  color:#fff
}

.reject{
  background:#ef4444;
  color:#fff
}

.block{
  background:#111827;
  color:#fff
}

.unblock{
  background:#dff2ff;
  color:#0066cc
}

.refresh{
  background:#0a84ff;
  color:#fff
}

.img{
  width:100%;
  max-height:480px;
  object-fit:contain;
  border-radius:14px;
  background:#f8fafc;
  margin-top:10px
}

.empty{
  text-align:center;
  color:#64748b
}

.tabs{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px
}

.tab{
  background:#e8f1ff;
  color:#075985
}

.error{
  color:#b91c1c;
  white-space:pre-wrap
}

.section-title{
  font-size:18px;
  font-weight:900;
  margin-bottom:10px
}

@media(max-width:550px){

  body{
    padding:10px
  }

  .stats{
    grid-template-columns:1fr 1fr
  }

  .head{
    align-items:flex-start;
    flex-direction:column
  }

}

</style>

</head>

<body>

<div class="wrap">

<div class="head">

<div>

<h1>
TON Dropy
</h1>

<div
  style="
    color:#64748b;
    font-size:13px
  "
>
مدیریت پرداخت‌ها و کاربران
</div>

</div>

<button
  class="btn refresh"
  style="
    width:auto;
    margin:0;
    padding:10px 18px
  "
  onclick="loadAll()"
>
🔄 بروزرسانی
</button>

</div>


<div class="stats">

<div class="stat">

<b id="all">
۰
</b>

<span>
کل رسیدهای در انتظار
</span>

</div>


<div class="stat">

<b id="money">
۰
</b>

<span>
مبلغ در انتظار
</span>

</div>


<div class="stat">

<b id="blockedCount">
۰
</b>

<span>
کاربران مسدود
</span>

</div>

</div>


<div class="card">

<div class="tabs">

<button
  class="btn tab"
  onclick="loadAll()"
>
🧾 رسیدها
</button>

<button
  class="btn tab"
  onclick="loadBlocked()"
>
🚫 کاربران مسدود
</button>

</div>

</div>


<div class="card">

<div class="section-title">
رسیدهای در انتظار
</div>

<div id="receipts">
در حال دریافت...
</div>

</div>


<div class="card">

<div class="section-title">
کاربران مسدود
</div>

<div id="blockedUsers">
برای مشاهده بروزرسانی کنید.
</div>

</div>

</div>


<script>

const secret=
  new URLSearchParams(
    location.search
  ).get("secret");


const $=
  id=>document.getElementById(id);


const esc=
  x=>
    String(x??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");


if(
  secret!=="TondropyAdmin2026"
){

  $("receipts").innerHTML=
    '<div class="error">' +
    'دسترسی غیرمجاز!' +
    '</div>';

}else{

  loadAll();

}


async function api(
  path,
  opts={}
){

  const r=
    await fetch(
      path,
      {
        cache:"no-store",
        ...opts
      }
    );

  let d={};

  try{
    d=await r.json();
  }catch(e){}

  if(
    !r.ok ||
    d.success===false
  ){

    throw new Error(
      d.error||
      d.message||
      ("HTTP "+r.status)
    );

  }

  return d;

}


async function loadAll(){

  if(
    secret!=="TondropyAdmin2026"
  )return;

  $("receipts").textContent=
    "در حال دریافت...";

  try{

    const d=
      await api(
        "/api/admin/receipts-v2?secret="+
        encodeURIComponent(secret)
      );


    $("all").textContent=
      d.length.toLocaleString("fa-IR");


    $("money").textContent=
      d
        .reduce(
          (s,x)=>
            s+(Number(x.amount)||0),
          0
        )
        .toLocaleString("fa-IR");


    if(!d.length){

      $("receipts").innerHTML=
        '<div class="empty">' +
        'رسید در انتظار وجود ندارد.' +
        '</div>';

    }else{

      $("receipts").innerHTML=
        d.map(
          r=>receiptHtml(r)
        ).join("");

    }


    await loadBlocked();

  }catch(e){

    $("receipts").innerHTML=
      '<div class="error">' +
      'خطا: '+
      esc(e.message)+
      '</div>';

  }

}


function receiptHtml(r){

  const u=
    r.users||{};


  return `

<div
  class="receipt"
  id="r-${esc(r.id)}"
>

<div class="row">
<span>کاربر</span>
<b>
@${esc(
  u.username||
  r.username||
  "ناشناس"
)}
</b>
</div>


<div class="row">
<span>Telegram ID</span>
<b>
${esc(
  u.telegram_id||
  r.telegram_id||
  ""
)}
</b>
</div>


<div class="row">
<span>مبلغ</span>
<b>
${Number(
  r.amount||0
).toLocaleString("fa-IR")}
 تومان
</b>
</div>


<div class="row">
<span>روش</span>
<b>
${esc(
  r.method==="full"
    ?"کامل"
    :"اقساطی"
)}
</b>
</div>


<div class="row">
<span>وضعیت</span>
<span class="badge">
در انتظار
</span>
</div>


${
r.image_url
?
`
<img
  class="img"
  src="${esc(r.image_url)}"
>
`
:
`
<div
  class="muted"
  style="margin-top:10px"
>
تصویر در Supabase ذخیره نشده؛
رسید در Telegram ارسال شده است.
</div>
`
}


<button
  class="btn approve"
  onclick="action(
    '${esc(r.id)}',
    '${esc(r.user_id)}',
    'approve'
  )"
>
✅ تأیید پرداخت
</button>


<button
  class="btn reject"
  onclick="action(
    '${esc(r.id)}',
    '${esc(r.user_id)}',
    'reject'
  )"
>
❌ رد رسید
</button>


<button
  class="btn block"
  onclick="action(
    '${esc(r.id)}',
    '${esc(r.user_id)}',
    'block'
  )"
>
🚫 مسدودی کاربر
</button>

</div>

`;

}


async function action(
  receiptId,
  userId,
  actionName
){

  const messages={

    approve:
      "رسید تأیید شود؟ حساب کاربر فعال می‌شود.",

    reject:
      "رسید رد شود؟ کاربر دوباره به صفحه فعال‌سازی برمی‌گردد.",

    block:
      "کاربر مسدود شود؟ Mini App پیام «حساب شما مسدود شده است» را نمایش می‌دهد.",

    unblock:
      "مسدودی این کاربر برداشته شود؟"

  };


  if(
    !confirm(
      messages[actionName]
    )
  )return;


  try{

    const d=
      await api(
        "/api/admin/action",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            secret,

            action:
              actionName,

            receiptId,

            userId

          })

        }
      );


    alert(
      d.message||
      "عملیات انجام شد."
    );


    await loadAll();

  }catch(e){

    alert(
      "خطا: "+
      e.message
    );

  }

}


async function loadBlocked(){

  try{

    const d=
      await api(
        "/api/admin/users?secret="+
        encodeURIComponent(secret)+
        "&status=blocked"
      );


    $("blockedCount").textContent=
      d.length.toLocaleString("fa-IR");


    if(!d.length){

      $("blockedUsers").innerHTML=
        '<div class="empty">' +
        'کاربر مسدودی وجود ندارد.' +
        '</div>';

      return;

    }


    $("blockedUsers").innerHTML=
      d.map(
        u=>`

<div class="receipt">

<div class="row">

<span>
کاربر
</span>

<b>
@${esc(
  u.username||
  "ناشناس"
)}
</b>

</div>


<div class="row">

<span>
Telegram ID
</span>

<b>
${esc(
  u.telegram_id||
  ""
)}
</b>

</div>


<button
  class="btn unblock"
  onclick="action(
    '',
    '${esc(u.id)}',
    'unblock'
  )"
>
🔓 رفع مسدودی کاربر
</button>

</div>

`
      ).join("");


  }catch(e){

    $("blockedUsers").innerHTML=
      '<div class="error">'+
      esc(e.message)+
      '</div>';

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
// TEST DATABASE
// ======================================================

app.get(
  "/api/test-db",
  async(req,res)=>{

    try{

      const r=
        await axios.get(

          `${SUPABASE_URL}/rest/v1/users?select=id,telegram_id,username&limit=1`,

          {
            headers:
              headers(),

            timeout:
              10000
          }

        );

      res.json({

        success:true,

        message:
          "اتصال به دیتابیس موفق بود",

        data:
          r.data

      });

    }catch(e){

      res.status(500).json({

        success:false,

        ...errInfo(e)

      });

    }

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
      }=req.body||{};


      if(!initData){

        return res.status(400).json({

          success:false,

          message:
            "initData ارسال نشده است."

        });

      }


      if(
        !verifyTelegram(initData)
      ){

        return res.status(401).json({

          success:false,

          message:
            "اطلاعات Telegram نامعتبر است."

        });

      }


      const p=
        new URLSearchParams(
          initData
        );


      const tg=
        JSON.parse(
          p.get("user")||"{}"
        );


      if(!tg.id){

        return res.status(400).json({

          success:false,

          message:
            "اطلاعات کاربر Telegram وجود ندارد."

        });

      }


      let u=
        await userByTelegram(
          tg.id
        );


      if(!u){

        const r=
          await axios.post(

            `${SUPABASE_URL}/rest/v1/users`,

            {

              telegram_id:
                tg.id,

              first_name:
                tg.first_name||
                "",

              username:
                tg.username||
                "user",

              account_status:
                "inactive"

            },

            {

              headers:
                headers(),

              timeout:
                10000

            }

          );


        u=
          r.data?.[0];

      }else{

        await axios.patch(

          `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(u.id)}`,

          {

            first_name:
              tg.first_name||
              u.first_name||
              "",

            username:
              tg.username||
              u.username||
              "user"

          },

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );

      }


      if(!u){

        throw new Error(
          "کاربر در Supabase ساخته نشد."
        );

      }


      res.json({

        success:true,

        user:{

          id:
            u.id,

          telegram_id:
            tg.id,

          name:
            tg.first_name||
            u.first_name||
            "کاربر",

          username:
            tg.username||
            u.username||
            "user",

          status:
            u.account_status||
            "inactive"

        }

      });


    }catch(e){

      console.error(
        "AUTH",
        errInfo(e)
      );

      res.status(500).json({

        success:false,

        message:
          e.message,

        details:
          e.response?.data||
          null

      });

    }

  }
);


// ======================================================
// LIVE USER STATUS
// ======================================================

app.post(
  "/api/user/status",
  async(req,res)=>{

    try{

      const {
        initData
      }=req.body||{};


      if(
        !initData||
        !verifyTelegram(initData)
      ){

        return res.status(401).json({

          success:false,

          message:
            "Telegram نامعتبر است."

        });

      }


      const p=
        new URLSearchParams(
          initData
        );


      const tg=
        JSON.parse(
          p.get("user")||"{}"
        );


      const u=
        await userByTelegram(
          tg.id
        );


      if(!u){

        return res.status(404).json({

          success:false,

          message:
            "کاربر پیدا نشد."

        });

      }


      res.json({

        success:true,

        user:{

          id:
            u.id,

          telegram_id:
            u.telegram_id,

          name:
            u.first_name||
            tg.first_name||
            "کاربر",

          username:
            u.username||
            tg.username||
            "user",

          status:
            u.account_status||
            "inactive"

        }

      });

    }catch(e){

      res.status(500).json({

        success:false,

        message:
          e.message

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
      req.query.secret!==
      ADMIN_SECRET
    ){

      return res.status(403).json({

        success:false,

        error:
          "Forbidden"

      });

    }


    try{

      const r=
        await axios.get(

          `${SUPABASE_URL}/rest/v1/receipts?status=eq.pending&select=*`,

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      const receipts=
        Array.isArray(r.data)
          ?r.data
          :[];


      const ids=[
        ...new Set(
          receipts
            .map(
              x=>x.user_id
            )
            .filter(Boolean)
        )
      ];


      let users=[];


      if(ids.length){

        const or=
          ids
            .map(
              id=>
                `id.eq.${encodeURIComponent(id)}`
            )
            .join(",");


        const ur=
          await axios.get(

            `${SUPABASE_URL}/rest/v1/users?select=id,username,telegram_id,account_status&or=(${or})`,

            {

              headers:
                headers(),

              timeout:
                10000

            }

          );


        users=
          ur.data||[];

      }


      res.json(

        receipts.map(
          x=>({

            ...x,

            users:
              users.find(
                u=>
                  String(u.id)===
                  String(x.user_id)
              )||
              {
                username:
                  "ناشناس"
              }

          })
        )

      );


    }catch(e){

      console.error(
        "RECEIPTS",
        errInfo(e)
      );

      res.status(500).json({

        success:false,

        error:
          e.message,

        details:
          e.response?.data||
          null

      });

    }

  }
);


// ======================================================
// ADMIN USERS
// ======================================================

app.get(
  "/api/admin/users",
  async(req,res)=>{

    if(
      req.query.secret!==
      ADMIN_SECRET
    ){

      return res.status(403).json({

        success:false,

        error:
          "Forbidden"

      });

    }


    try{

      const status=
        req.query.status||
        "blocked";


      const r=
        await axios.get(

          `${SUPABASE_URL}/rest/v1/users?account_status=eq.${encodeURIComponent(status)}&select=id,telegram_id,username,first_name,account_status&order=id.desc`,

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      res.json(
        r.data||[]
      );


    }catch(e){

      res.status(500).json({

        success:false,

        error:
          e.message,

        details:
          e.response?.data||
          null

      });

    }

  }
);


// ======================================================
// ADMIN ACTIONS
//
// approve => receipt approved + user active
// reject  => receipt rejected + user inactive
// block   => user blocked
// unblock => user inactive
// ======================================================

app.post(
  "/api/admin/action",
  async(req,res)=>{

    const {
      secret,
      action,
      receiptId,
      userId
    }=req.body||{};


    if(
      secret!==
      ADMIN_SECRET
    ){

      return res.status(403).json({

        success:false,

        error:
          "Forbidden"

      });

    }


    if(
      ![
        "approve",
        "reject",
        "block",
        "unblock"
      ].includes(action)
    ){

      return res.status(400).json({

        success:false,

        error:
          "عملیات نامعتبر است."

      });

    }


    if(!userId){

      return res.status(400).json({

        success:false,

        error:
          "userId ارسال نشده است."

      });

    }


    try{

      const u=
        await userById(
          userId
        );


      if(!u){

        return res.status(404).json({

          success:false,

          error:
            "کاربر پیدا نشد."

        });

      }


      // ================= BLOCK / UNBLOCK =================

      if(
        action==="block"||
        action==="unblock"
      ){

        const newStatus=
          action==="block"
            ?"blocked"
            :"inactive";


        await axios.patch(

          `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,

          {
            account_status:
              newStatus
          },

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


        if(
          action==="block"&&
          receiptId
        ){

          await axios.patch(

            `${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(receiptId)}&status=eq.pending`,

            {
              status:
                "rejected"
            },

            {

              headers:
                headers(),

              timeout:
                10000

            }

          );

        }


        return res.json({

          success:true,

          message:
            action==="block"
              ?"کاربر مسدود شد."
              :"مسدودی کاربر رفع شد و حساب به صفحه فعال‌سازی برگشت."

        });

      }


      // ================= APPROVE / REJECT =================

      if(!receiptId){

        return res.status(400).json({

          success:false,

          error:
            "receiptId ارسال نشده است."

        });

      }


      const rr=
        await axios.get(

          `${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(receiptId)}&select=*`,

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      const receipt=
        rr.data?.[0];


      if(!receipt){

        return res.status(404).json({

          success:false,

          error:
            "رسید پیدا نشد."

        });

      }


      if(
        String(receipt.user_id)!==
        String(userId)
      ){

        return res.status(400).json({

          success:false,

          error:
            "رسید متعلق به این کاربر نیست."

        });

      }


      if(
        receipt.status!==
        "pending"
      ){

        return res.status(409).json({

          success:false,

          error:
            "این رسید قبلاً بررسی شده است.",

          current_status:
            receipt.status

        });

      }


      const receiptStatus=
        action==="approve"
          ?"approved"
          :"rejected";


      const userStatus=
        action==="approve"
          ?"active"
          :"inactive";


      const update=
        await axios.patch(

          `${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(receiptId)}&status=eq.pending`,

          {
            status:
              receiptStatus
          },

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      if(
        !update.data?.length
      ){

        return res.status(409).json({

          success:false,

          error:
            "رسید قبلاً بررسی شده است."

        });

      }


      await axios.patch(

        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,

        {

          account_status:
            userStatus

        },

        {

          headers:
            headers(),

          timeout:
            10000

        }

      );


      return res.json({

        success:true,

        message:
          action==="approve"
            ?"پرداخت تأیید شد و حساب کاربر فعال شد."
            :"رسید رد شد و کاربر دوباره به صفحه فعال‌سازی برگشت."

      });


    }catch(e){

      console.error(
        "ADMIN ACTION",
        errInfo(e)
      );

      res.status(500).json({

        success:false,

        error:
          e.message,

        details:
          e.response?.data||
          null

      });

    }

  }
);


// ======================================================
// OLD ADMIN REVIEW COMPATIBILITY
// ======================================================

app.post(
  "/api/admin/review",
  async(req,res)=>{

    const {
      receiptId,
      userId,
      action,
      secret
    }=req.body||{};


    req.body={

      receiptId,
      userId,
      action,
      secret

    };


    return req.app._router.handle(

      Object.assign(

        req,

        {

          url:
            "/api/admin/action",

          originalUrl:
            "/api/admin/action",

          method:
            "POST",

          body:{

            receiptId,
            userId,
            action,
            secret

          }

        }

      ),

      res,

      ()=>{}

    );

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

        initData,
        telegramId,
        userId,
        username,
        amount,
        method,
        imageBase64

      }=req.body||{};


      if(
        !imageBase64||
        !amount||
        !method
      ){

        return res.status(400).json({

          success:false,

          message:
            "اطلاعات رسید ناقص است."

        });

      }


      if(
        ![
          "full",
          "installment"
        ].includes(method)
      ){

        return res.status(400).json({

          success:false,

          message:
            "روش پرداخت نامعتبر است."

        });

      }


      if(
        !initData||
        !verifyTelegram(initData)
      ){

        return res.status(401).json({

          success:false,

          message:
            "اطلاعات Telegram نامعتبر است."

        });

      }


      const p=
        new URLSearchParams(
          initData
        );


      const tg=
        JSON.parse(
          p.get("user")||
          "{}"
        );


      const verifiedId=
        String(
          tg.id||
          telegramId||
          ""
        );


      let u=
        await userByTelegram(
          verifiedId
        );


      if(
        !u&&
        userId
      ){

        u=
          await userById(
            userId
          );

      }


      if(!u){

        return res.status(404).json({

          success:false,

          message:
            "کاربر در دیتابیس پیدا نشد."

        });

      }


      if(
        u.account_status===
        "blocked"
      ){

        return res.status(403).json({

          success:false,

          message:
            "حساب شما مسدود شده است."

        });

      }


      if(
        u.account_status===
        "active"
      ){

        return res.status(409).json({

          success:false,

          message:
            "حساب شما قبلاً فعال شده است."

        });

      }


      const n=
        parseInt(
          amount,
          10
        );


      if(
        !Number.isFinite(n)||
        n<=0
      ){

        return res.status(400).json({

          success:false,

          message:
            "مبلغ نامعتبر است."

        });

      }


      if(
        imageBase64.length>
        5000000
      ){

        return res.status(400).json({

          success:false,

          message:
            "حجم عکس زیاد است."

        });

      }


      // جلوگیری از ثبت رسید تکراری

      const dup=
        await axios.get(

          `${SUPABASE_URL}/rest/v1/receipts?user_id=eq.${encodeURIComponent(u.id)}&status=eq.pending&select=id&limit=1`,

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      if(
        dup.data?.length
      ){

        return res.status(409).json({

          success:false,

          message:
            "برای این حساب یک رسید در انتظار بررسی وجود دارد."

        });

      }


      // ثبت رسید

      const ir=
        await axios.post(

          `${SUPABASE_URL}/rest/v1/receipts`,

          {

            user_id:
              u.id,

            amount:
              n,

            method,

            status:
              "pending"

          },

          {

            headers:
              headers(),

            timeout:
              10000

          }

        );


      const receipt=
        ir.data?.[0];


      if(!receipt){

        throw new Error(
          "رسید در Supabase ثبت نشد."
        );

      }


      // pending کردن کاربر

      await axios.patch(

        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(u.id)}`,

        {

          account_status:
            "pending"

        },

        {

          headers:
            headers(),

          timeout:
            10000

        }

      );


      // ارسال رسید به Telegram

      const b64=
        imageBase64
          .replace(
            /^data:image\/[^;]+;base64/,
            ""
          )
          .replace(
            /^,/,
            ""
          );


      const buffer=
        Buffer.from(
          b64,
          "base64"
        );


      const form=
        new FormData();


      form.append(
        "chat_id",
        TELEGRAM_CHAT_ID
      );


      form.append(

        "caption",

        "🧾 رسید جدید\n"+
        "👤 کاربر: @"+
        (
          u.username||
          username||
          "user"
        )+
        "\n"+
        "🆔 Telegram ID: "+
        (
          u.telegram_id||
          verifiedId
        )+
        "\n"+
        "💰 مبلغ: "+
        n+
        " تومان\n"+
        "💳 روش: "+
        (
          method==="full"
            ?"کامل"
            :"اقساطی"
        )+
        "\n"+
        "🆔 Receipt ID: "+
        receipt.id

      );


      form.append(

        "photo",

        new Blob(
          [buffer],
          {
            type:
              "image/jpeg"
          }
        ),

        "receipt.jpg"

      );


      const tgRes=
        await fetch(

          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,

          {

            method:
              "POST",

            body:
              form

          }

        );


      const tgData=
        await tgRes.json();


      if(!tgData.ok){

        return res.status(502).json({

          success:false,

          message:
            "رسید در دیتابیس ثبت شد اما ارسال تصویر به Telegram ناموفق بود.",

          receipt_id:
            receipt.id,

          telegram_error:
            tgData.description

        });

      }


      res.json({

        success:true,

        message:
          "رسید با موفقیت ثبت شد.",

        receipt_id:
          receipt.id

      });


    }catch(e){

      console.error(
        "UPLOAD",
        errInfo(e)
      );

      res.status(500).json({

        success:false,

        message:
          e.message,

        details:
          e.response?.data||
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
// VERCEL EXPORT
// ======================================================

module.exports=app;
