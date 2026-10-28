// 👈 این خط مشکل fetch failed در ورسل را برای همیشه حل می‌کند
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const TELEGRAM_BOT_TOKEN = "8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk"; 
const TELEGRAM_CHAT_ID = "5972276401";
const ADMIN_SECRET = "TondropyAdmin2026";

const SUPABASE_URL = "https://vqddirelnxiklanmquuu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGRpcmVsbnhpa2xhbm5xdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTUwMDQsImV4cCI6MjEwODY3MTAwNH0.8DfaBrDuOBnnZM94NbZ_Ia4carmmKOw5vxviZhq_U8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// ==========================================
// کدهای HTML کاربر
// ==========================================
const userHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TON Dropy</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
<style>
  :root { --brand: #0A84FF; --brand-dark: #0066CC; --success: #22C55E; --warning: #F59E0B; --danger: #EF4444; --glass-bg: rgba(255, 255, 255, 0.65); --glass-border: rgba(255, 255, 255, 0.9); --text-main: #0B1220; --text-muted: #64748B; }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif; color: var(--text-main); min-height: 100vh; background: radial-gradient(ellipse 60% 50% at 15% 0%, rgba(10,132,255,0.1), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 100%, rgba(100,200,255,0.08), transparent 60%), #F8FAFC; background-attachment: fixed; overflow-x: hidden; direction: rtl; }
  #app { min-height: 100vh; padding: 20px 16px; padding-bottom: 40px; display: flex; justify-content: center; }
  .page-container { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 16px; }
  .glass-card { background: var(--glass-bg); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid var(--glass-border); box-shadow: 0 8px 32px rgba(10,132,255,0.06), 0 2px 8px rgba(0,0,0,0.02); border-radius: 28px; padding: 24px 20px; text-align: center; width: 100%; animation: slideUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
  .glass-card-blue { background: rgba(239, 246, 255, 0.8); border-color: rgba(10,132,255,0.15); }
  .title-lg { font-size: 22px; font-weight: 900; color: var(--brand); margin: 0; }
  .subtitle { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }
  .label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
  .value-sm { font-size: 14px; font-weight: 700; color: var(--text-main); }
  .value-md { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 16px;}
  .value-lg { font-size: 28px; font-weight: 900; color: var(--text-main); }
  .value-blue { font-size: 22px; font-weight: 900; color: var(--brand); }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 16px; border: none; border-radius: 18px; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 0.2s ease; user-select: none; }
  .btn-primary { background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%); color: white; box-shadow: 0 8px 24px rgba(10,132,255,0.3); }
  .btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
  .btn-glass { background: rgba(255,255,255,0.8); color: var(--brand-dark); border: 1px solid rgba(10,132,255,0.2); box-shadow: 0 4px 12px rgba(10,132,255,0.05); }
  .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .method-card { background: rgba(255,255,255,0.5); border: 2px solid transparent; border-radius: 20px; padding: 20px 16px; cursor: pointer; transition: all 0.3s ease; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
  .method-card.active { background: rgba(239, 246, 255, 0.9); border-color: var(--brand); box-shadow: 0 8px 24px rgba(10,132,255,0.15); }
  .method-card .check-icon { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; background: var(--brand); color: white; border-radius: 50%; display: grid; place-items: center; font-size: 12px; opacity: 0; transform: scale(0.5); transition: all 0.2s; }
  .method-card.active .check-icon { opacity: 1; transform: scale(1); }
  .amount-display { font-size: 32px; font-weight: 900; color: var(--brand); transition: all 0.3s; }
  .fade-transition { animation: fadeScale 0.3s ease; }
  @keyframes fadeScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .upload-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px 20px; border: 2px dashed rgba(10,132,255,0.3); border-radius: 20px; background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; margin-top: 16px; }
  .file-preview { margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.6); border-radius: 16px; border: 1px solid rgba(10,132,255,0.1); }
  .file-preview img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 12px; margin-bottom: 12px; background: #fff; }
  .hidden { display: none !important; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<div id="app">
  <div class="page-container">
    <div class="glass-card" style="padding: 16px 20px; display:flex; justify-content:space-between; align-items:center;">
      <div style="text-align:right;"><h1 class="title-lg">TON Dropy</h1><div class="subtitle">فعال‌سازی حساب</div></div>
      <div id="status-badge" style="background:rgba(239,68,68,0.1); color:#EF4444; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px;"><div id="status-dot" style="width:8px; height:8px; border-radius:50%; background:#EF4444;"></div><span id="status-text">فعال نشده</span></div>
    </div>
    <div id="loading-section" class="glass-card"><p>در حال ارتباط...</p></div>
    <div id="error-section" class="glass-card hidden"><p style="color: var(--danger); font-weight: bold; margin-bottom: 8px;">خطا</p><p id="error-message" style="font-size: 13px; color: #333;"></p></div>
    <div id="inactive-section" class="hidden" style="display:flex; flex-direction:column; gap:16px;">
      <div class="glass-card" style="padding: 16px;"><div class="value-sm">سلام <span id="userNameDisplay" style="color:var(--brand)"></span> عزیز 👋</div><div class="label" style="margin-top:4px;">برای استفاده، حساب خود را فعال کنید.</div></div>
      <div class="glass-card glass-card-blue"><div class="label">هزینه فعال‌سازی</div><div class="value-lg" style="margin:8px 0;">۱۴ <span style="font-size:16px;">دلار</span></div><div class="value-sm" style="color:var(--brand);">معادل ۳,۷۸۰,۰۰۰ تومان</div></div>
      <div class="glass-card"><div class="value-md">روش پرداخت</div><div class="method-grid"><div class="method-card active" id="m-full" onclick="setMethod('full')"><div class="check-icon">✓</div><div class="value-sm">کامل</div><div class="value-blue" style="font-size:18px;">۳,۷۸۰,۰۰۰</div></div><div class="method-card" id="m-inst" onclick="setMethod('installment')"><div class="check-icon">✓</div><div class="value-sm">اقساطی</div><div class="value-blue" style="font-size:18px;">۹۴۵,۰۰۰</div></div></div></div>
      <div class="glass-card"><div class="value-md">کارت به کارت</div><div style="background:rgba(255,255,255,0.4); padding:16px; border-radius:16px; margin-bottom:16px;"><div style="display:flex; justify-content:space-between;"><span class="label">بانک:</span> <span class="value-sm">بانک شهر</span></div><div style="display:flex; justify-content:space-between;"><span class="label">صاحب حساب:</span> <span class="value-sm">نیما اسفندیاری</span></div><div style="display:flex; flex-direction:column; align-items:center; margin-top:8px;"><span class="label">شماره کارت</span><div style="font-size:22px; font-weight:900; direction:ltr; margin-top:4px;">5047061674676966</div></div></div><button class="btn-glass" onclick="copyCard()">کپی شماره کارت</button><div style="margin-top:16px; background:rgba(10,132,255,0.08); padding:16px; border-radius:16px;"><div class="label">مبلغ قابل پرداخت</div><div id="dynamic-amount" class="amount-display" style="margin-top:4px;">۳,۷۸۰,۰۰۰ <span style="font-size:16px;">تومان</span></div><div id="amount-desc" class="label" style="margin-top:4px;">پرداخت یکجا</div></div></div>
      <div class="glass-card"><div class="value-md">ارسال رسید</div><div id="upload-preview" class="hidden file-preview"><img id="preview-img" src=""><div style="display:flex; justify-content:space-between; margin-bottom:12px;"><div><div id="file-name" class="value-sm" style="font-size:12px;"></div></div><button onclick="removeReceipt()" style="width:auto; padding:8px; background:rgba(239,68,68,0.1); color:var(--danger); border-radius:8px; font-size:12px;">حذف</button></div><button id="submit-btn" class="btn-primary" onclick="uploadReceipt()">ارسال رسید</button></div><div id="upload-box-container"><label class="upload-box"><div style="font-size:28px;">📎</div><div style="font-size:14px; color:var(--brand);">انتخاب عکس</div><input type="file" id="receiptFile" accept="image/*" style="display:none;" onchange="handleFile(event)"></label></div></div>
    </div>
    <div id="pending-section" class="glass-card hidden"><div style="font-size:48px; margin-bottom:12px;">⏳</div><div class="value-md" style="color:var(--warning);">در انتظار تأیید</div><div class="label" style="margin-top:8px;">رسید شما بررسی می‌شود.</div></div>
    <div id="active-section" class="hidden" style="display:flex; flex-direction:column; gap:16px;"><div class="glass-card" style="border-color:var(--success);"><div style="font-size:48px; margin-bottom:12px;">✅</div><div class="value-md" style="color:var(--success);">حساب شما فعال است</div><div class="label">به داشبورد خوش آمدید.</div></div></div>
  </div>
</div>
<script>
  let currentMethod = 'full'; let currentUsername = ''; let receiptBase64 = '';
  window.onload = async function() {
    if (!window.Telegram || !window.Telegram.WebApp) return showError('اسکریپت تلگرام لود نشد.');
    const tgWebApp = window.Telegram.WebApp; tgWebApp.expand(); tgWebApp.enableClosingConfirmation();
    const initData = tgWebApp.initData;
    if (!initData) return showError('از ربات وارد شوید.');
    try {
      const res = await fetch('/api/auth/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: initData }) });
      const data = await res.json();
      if (data.success) {
        currentUsername = data.user.username || 'user';
        document.getElementById('userNameDisplay').innerText = data.user.name;
        document.getElementById('loading-section').classList.add('hidden');
        if (data.user.status === 'active') { document.getElementById('active-section').classList.remove('hidden'); setHeaderStatus('فعال', 'var(--success)', 'rgba(34,197,94,0.1)', '#22C55E'); }
        else if (data.user.status === 'pending') { document.getElementById('pending-section').classList.remove('hidden'); setHeaderStatus('در انتظار', 'var(--warning)', 'rgba(245,158,11,0.1)', '#F59E0B'); }
        else { document.getElementById('inactive-section').classList.remove('hidden'); }
      } else { showError(data.message); }
    } catch (e) { showError('خطا در سرور.'); }
  };
  function setHeaderStatus(text, textColor, bgColor, dotColor) { document.getElementById('status-text').innerText = text; document.getElementById('status-text').style.color = textColor; document.getElementById('status-badge').style.background = bgColor; document.getElementById('status-badge').style.color = textColor; document.getElementById('status-dot').style.background = dotColor; }
  function showError(msg) { document.getElementById('loading-section').classList.add('hidden'); document.getElementById('error-section').classList.remove('hidden'); document.getElementById('error-message').innerText = msg; }
  function setMethod(method) { currentMethod = method; document.getElementById('m-full').classList.remove('active'); document.getElementById('m-inst').classList.remove('active'); document.getElementById('m-' + (method === 'full' ? 'full' : 'inst')).classList.add('active'); const amountEl = document.getElementById('dynamic-amount'); amountEl.classList.remove('fade-transition'); void amountEl.offsetWidth; amountEl.classList.add('fade-transition'); if (method === 'full') { amountEl.innerHTML = '۳,۷۸۰,۰۰۰ <span style="font-size:16px;">تومان</span>'; document.getElementById('amount-desc').innerText = 'پرداخت یکجا'; } else { amountEl.innerHTML = '۹۴۵,۰۰۰ <span style="font-size:16px;">تومان</span>'; document.getElementById('amount-desc').innerText = 'قسط ۱ از ۴'; } }
  async function copyCard() { try { await navigator.clipboard.writeText('5047061674676966'); event.target.innerText = 'کپی شد ✓'; setTimeout(() => { event.target.innerText = 'کپی شماره کارت'; }, 2000); } catch (e) {} }
  function handleFile(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { receiptBase64 = e.target.result; document.getElementById('preview-img').src = receiptBase64; document.getElementById('file-name').innerText = file.name; document.getElementById('upload-box-container').classList.add('hidden'); document.getElementById('upload-preview').classList.remove('hidden'); }; reader.readAsDataURL(file); }
  function removeReceipt() { receiptBase64 = ''; document.getElementById('receiptFile').value = ''; document.getElementById('upload-box-container').classList.remove('hidden'); document.getElementById('upload-preview').classList.add('hidden'); }
  async function uploadReceipt() { if (!receiptBase64) return; const btn = document.getElementById('submit-btn'); btn.innerText = 'در حال ارسال...'; btn.disabled = true; try { const res = await fetch('/api/upload-receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUsername, method: currentMethod, amount: currentMethod === 'full' ? '3780000' : '945000', imageBase64: receiptBase64 }) }); const data = await res.json(); if (data.success) { document.getElementById('inactive-section').classList.add('hidden'); document.getElementById('pending-section').classList.remove('hidden'); setHeaderStatus('در انتظار', 'var(--warning)', 'rgba(245,158,11,0.1)', '#F59E0B'); } else { alert('خطا: ' + data.message); btn.innerText = 'ارسال رسید'; btn.disabled = false; } } catch (e) { alert('خطا در ارتباط'); btn.innerText = 'ارسال رسید'; btn.disabled = false; } }
</script>
</body>
</html>`;

const adminHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>پنل مدیریت</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
<style>
  body { font-family: 'Vazirmatn', sans-serif; background: #F8FAFC; margin: 0; padding: 20px; direction: rtl; }
  .card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee; }
  .title { color: #0A84FF; font-weight: 900; font-size: 20px; margin-bottom: 20px; text-align: center;}
  .btn { padding: 10px; border-radius: 8px; border: none; font-family: inherit; font-weight: bold; cursor: pointer; width: 100%; margin-top: 10px; }
  .btn-approve { background: #22C55E; color: white; }
  .btn-reject { background: #EF4444; color: white; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
</style>
</head>
<body>
  <div class="title">پنل مدیریت TON Dropy</div>
  <div id="list">در حال دریافت...</div>
<script>
  const secret = new URLSearchParams(window.location.search).get('secret');
  if (secret !== 'TondropyAdmin2026') {
    document.getElementById('list').innerHTML = '<div class="card" style="color:red;text-align:center;">دسترسی غیرمجاز!</div>';
  } else { loadReceipts(); }

  async function loadReceipts() {
    const res = await fetch('/api/admin/receipts?secret=' + secret);
    const data = await res.json();
    const list = document.getElementById('list');
    list.innerHTML = '';
    if (data.length === 0) { list.innerHTML = '<div class="card" style="text-align:center;">رسیدی وجود ندارد.</div>'; return; }
    
    data.forEach(item => {
      const username = item.users ? item.users.username : 'ناشناس';
      list.innerHTML += '<div class="card" id="card-' + item.id + '">' +
        '<div class="row"><span>کاربر:</span> <b>@' + username + '</b></div>' +
        '<div class="row"><span>مبلغ:</span> <b>' + item.amount + ' تومان</b></div>' +
        '<div class="row"><span>روش:</span> <b>' + (item.method === 'full' ? 'کامل' : 'اقساطی') + '</b></div>' +
        '<button class="btn btn-approve" onclick="review(\'' + item.id + '\', \'' + item.user_id + '\', \'approve\')">تأیید</button>' +
        '<button class="btn btn-reject" onclick="review(\'' + item.id + '\', \'' + item.user_id + '\', \'reject\')">رد</button>' +
      '</div>';
    });
  }

  async function review(receiptId, userId, action) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId: receiptId, userId: userId, action: action, secret: secret })
    });
    document.getElementById('card-' + receiptId).remove();
  }
</script>
</body>
</html>`;

// ==========================================
// API Routes
// ==========================================

app.get('/', (req, res) => { 
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(userHtml); 
});

app.get('/admin', (req, res) => { res.send(adminHtml); });

function verifyTelegramWebAppData(telegramInitData) {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  initData.delete('hash');
  const dataCheckString = Array.from(initData.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return calculatedHash === hash;
}

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData || !verifyTelegramWebAppData(initData)) return res.status(401).json({ success: false, message: 'اطلاعات نامعتبر' });
    const tgUser = JSON.parse(new URLSearchParams(initData).get('user'));
    
    let user = null;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('telegram_id', tgUser.id).maybeSingle();
      if (error) throw error;
      user = data;
    } catch (dbError) {
      return res.status(500).json({ success: false, message: 'خطای ارتباط با Supabase: ' + dbError.message });
    }

    if (!user) {
      const { data: newUser, error: insertError } = await supabase.from('users').insert([{ telegram_id: tgUser.id, first_name: tgUser.first_name, username: tgUser.username || 'user', account_status: 'inactive' }]).select().single();
      if (insertError) return res.status(500).json({ success: false, message: 'خطا در ایجاد کاربر: ' + insertError.message });
      user = newUser;
    }
    
    res.json({ success: true, user: { id: tgUser.id, name: tgUser.first_name, username: tgUser.username || 'user', status: user.account_status } });
  } catch (error) { 
    res.status(500).json({ success: false, message: 'خطای سرور: ' + error.message }); 
  }
});

app.post('/api/upload-receipt', async (req, res) => {
  try {
    const { username, amount, method, imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'عکسی ارسال نشد' });

    const { data: user } = await supabase.from('users').select('id').eq('username', username).single();
    if (!user) throw new Error('کاربر یافت نشد');

    await supabase.from('receipts').insert([{ user_id: user.id, amount: parseInt(amount), method: method, status: 'pending' }]);
    await supabase.from('users').update({ account_status: 'pending' }).eq('id', user.id);

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    const methodText = method === 'installment' ? 'اقساطی' : 'کامل';
    const caption = "🧾 رسید جدید\n👤 کاربر: @" + username + "\n💰 مبلغ: " + amount + " تومان\n💳 روش: " + methodText;
    formData.append('caption', caption);
    formData.append('photo', blob, 'receipt.jpg');
    
    await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendPhoto', { method: 'POST', body: formData });

    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

app.get('/api/admin/receipts', async (req, res) => {
  if (req.query.secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('receipts').select('*, users(username)').eq('status', 'pending');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/admin/review', async (req, res) => {
  const { receiptId, userId, action, secret } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });

  if (action === 'approve') {
    await supabase.from('receipts').update({ status: 'approved' }).eq('id', receiptId);
    await supabase.from('users').update({ account_status: 'active' }).eq('id', userId);
  } else {
    await supabase.from('receipts').update({ status: 'rejected' }).eq('id', receiptId);
    await supabase.from('users').update({ account_status: 'inactive' }).eq('id', userId);
  }
  res.json({ success: true });
});

module.exports = app;
