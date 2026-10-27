const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

const TELEGRAM_BOT_TOKEN = "8959966218:AAH6lNe8K4UVAeDGJATBdf9Y877SKxPYkho"; 
const TELEGRAM_CHAT_ID = "5972276401";

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// ==========================================
// کدهای رابط کاربری (HTML/CSS/JS) - نسخه شیشه‌ای (Version 1)
// ==========================================
const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TON Dropy</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
<style>
  :root {
    --brand: #0A84FF;
    --brand-dark: #0066CC;
    --success: #22C55E;
    --danger: #EF4444;
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-border: rgba(255, 255, 255, 0.9);
    --text-main: #0B1220;
    --text-muted: #64748B;
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif;
    color: var(--text-main); min-height: 100vh;
    background:
      radial-gradient(ellipse 60% 50% at 15% 0%, rgba(10,132,255,0.1), transparent 60%),
      radial-gradient(ellipse 55% 45% at 90% 100%, rgba(100,200,255,0.08), transparent 60%),
      #F8FAFC;
    background-attachment: fixed; overflow-x: hidden; direction: rtl;
  }
  
  #app { min-height: 100vh; padding: 20px 16px; padding-bottom: 40px; display: flex; justify-content: center; }
  .page-container { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 16px; }

  /* Glassmorphism */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px rgba(10,132,255,0.06), 0 2px 8px rgba(0,0,0,0.02);
    border-radius: 28px;
    padding: 24px 20px;
    text-align: center;
    width: 100%;
    animation: slideUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1) both;
  }

  .glass-card-blue { background: rgba(239, 246, 255, 0.8); border-color: rgba(10,132,255,0.15); }
  
  /* Typography */
  .title-lg { font-size: 22px; font-weight: 900; color: var(--brand); margin: 0; }
  .subtitle { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }
  .label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
  .value-sm { font-size: 14px; font-weight: 700; color: var(--text-main); }
  .value-md { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 16px;}
  .value-lg { font-size: 28px; font-weight: 900; color: var(--text-main); }
  .value-blue { font-size: 22px; font-weight: 900; color: var(--brand); }

  /* Elements */
  button {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 16px; border: none; border-radius: 18px;
    font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer;
    transition: all 0.2s ease; user-select: none;
  }
  .btn-primary { background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%); color: white; box-shadow: 0 8px 24px rgba(10,132,255,0.3); }
  .btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
  .btn-glass { background: rgba(255,255,255,0.8); color: var(--brand-dark); border: 1px solid rgba(10,132,255,0.2); box-shadow: 0 4px 12px rgba(10,132,255,0.05); }
  .btn-glass:active { background: rgba(10,132,255,0.08); }

  /* Payment Method Selector */
  .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .method-card {
    background: rgba(255,255,255,0.5); border: 2px solid transparent; border-radius: 20px;
    padding: 20px 16px; cursor: pointer; transition: all 0.3s ease; position: relative;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .method-card:hover { background: rgba(255,255,255,0.8); }
  .method-card.active {
    background: rgba(239, 246, 255, 0.9); border-color: var(--brand);
    box-shadow: 0 8px 24px rgba(10,132,255,0.15);
  }
  .method-card .check-icon {
    position: absolute; top: 12px; left: 12px; width: 20px; height: 20px;
    background: var(--brand); color: white; border-radius: 50%;
    display: grid; place-items: center; font-size: 12px; opacity: 0; transform: scale(0.5); transition: all 0.2s;
  }
  .method-card.active .check-icon { opacity: 1; transform: scale(1); }

  /* Installment Timeline */
  .timeline { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; position: relative; padding: 0 10px; }
  .timeline::before {
    content: ''; position: absolute; top: 24px; left: 30px; right: 30px; height: 2px;
    background: rgba(10,132,255,0.15); z-index: 1;
  }
  .timeline-step { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .timeline-circle {
    width: 48px; height: 48px; border-radius: 50%; background: #fff;
    border: 2px solid rgba(10,132,255,0.15); color: var(--text-muted);
    display: grid; place-items: center; font-size: 16px; font-weight: 800; transition: all 0.3s;
  }
  .timeline-step.active .timeline-circle { border-color: var(--brand); background: var(--brand); color: #fff; box-shadow: 0 4px 12px rgba(10,132,255,0.3); }
  .timeline-label { font-size: 11px; font-weight: 700; color: var(--text-main); }
  .timeline-sub { font-size: 10px; color: var(--text-muted); }

  .amount-display { font-size: 32px; font-weight: 900; color: var(--brand); transition: all 0.3s; }
  .fade-transition { animation: fadeScale 0.3s ease; }
  @keyframes fadeScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

  /* Upload Area */
  .upload-box {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 32px 20px; border: 2px dashed rgba(10,132,255,0.3); border-radius: 20px;
    background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; margin-top: 16px;
  }
  .upload-box:hover { background: rgba(10,132,255,0.05); border-color: var(--brand); }
  .file-preview { margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.6); border-radius: 16px; border: 1px solid rgba(10,132,255,0.1); }
  .file-preview img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 12px; margin-bottom: 12px; background: #fff; }

  .hidden { display: none !important; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>

<div id="app">
  <div class="page-container">
  
    <!-- Header -->
    <div class="glass-card" style="padding: 16px 20px; display:flex; justify-content:space-between; align-items:center;">
      <div style="text-align:right;">
        <h1 class="title-lg">TON Dropy</h1>
        <div class="subtitle">فعال‌سازی حساب و کیف پول</div>
      </div>
      <div style="background:rgba(239,68,68,0.1); color:#EF4444; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px;">
        <div style="width:8px; height:8px; border-radius:50%; background:#EF4444;"></div>
        فعال نشده
      </div>
    </div>

    <!-- Loading State -->
    <div id="loading-section" class="glass-card">
      <p>در حال بررسی هویت تلگرام...</p>
    </div>

    <!-- Error State -->
    <div id="error-section" class="glass-card hidden">
      <p style="color: var(--danger); font-weight: bold; margin-bottom: 8px;">خطا</p>
      <p id="error-message" style="font-size: 13px; color: #333;"></p>
    </div>

    <!-- Main App (Hidden initially) -->
    <div id="main-section" class="hidden" style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- User Greeting -->
      <div class="glass-card" style="padding: 16px;">
         <div class="value-sm">سلام <span id="userNameDisplay" style="color:var(--brand)"></span> عزیز 👋</div>
         <div class="label" style="margin-top:4px;">برای استفاده از خدمات، حساب خود را فعال کنید.</div>
      </div>

      <!-- Cost Card -->
      <div class="glass-card glass-card-blue">
        <div class="label">هزینه فعال‌سازی</div>
        <div class="value-lg" style="margin:8px 0;">۱۴ <span style="font-size:16px;">دلار</span></div>
        <div class="value-sm" style="color:var(--brand);">معادل ۳,۷۸۰,۰۰۰ تومان</div>
      </div>

      <!-- Payment Method -->
      <div class="glass-card">
        <div class="value-md">روش پرداخت را انتخاب کنید</div>
        <div class="method-grid">
          <div class="method-card active" id="m-full" onclick="setMethod('full')">
            <div class="check-icon">✓</div>
            <div class="value-sm">پرداخت کامل</div>
            <div class="value-blue" style="font-size:18px;">۳,۷۸۰,۰۰۰</div>
            <div class="label">یکجا</div>
          </div>
          <div class="method-card" id="m-inst" onclick="setMethod('installment')">
            <div class="check-icon">✓</div>
            <div class="value-sm">اقساطی</div>
            <div class="value-blue" style="font-size:18px;">۹۴۵,۰۰۰</div>
            <div class="label">۴ ماه</div>
          </div>
        </div>
      </div>

      <!-- Installments Timeline (Hidden by default) -->
      <div id="installment-section" class="glass-card hidden">
        <div class="label" style="margin-bottom:16px;">وضعیت اقساط</div>
        <div class="timeline">
          <div class="timeline-step active">
            <div class="timeline-circle">۱</div>
            <div class="timeline-label">قسط اول</div>
            <div class="timeline-sub" style="color:var(--brand);">قابل پرداخت</div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">۲</div>
            <div class="timeline-label">قسط دوم</div>
            <div class="timeline-sub">در انتظار</div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">۳</div>
            <div class="timeline-label">قسط سوم</div>
            <div class="timeline-sub">در انتظار</div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">۴</div>
            <div class="timeline-label">قسط چهارم</div>
            <div class="timeline-sub">در انتظار</div>
          </div>
        </div>
      </div>

      <!-- Card Info -->
      <div class="glass-card">
        <div class="value-md">روش پرداخت: کارت به کارت</div>
        <div style="display:flex; flex-direction:column; gap:10px; background:rgba(255,255,255,0.4); padding:16px; border-radius:16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between;"><span class="label">بانک:</span> <span class="value-sm">بانک شهر</span></div>
          <div style="display:flex; justify-content:space-between;"><span class="label">صاحب حساب:</span> <span class="value-sm">نیما اسفندیاری</span></div>
          <div style="display:flex; flex-direction:column; align-items:center; margin-top:8px;">
            <span class="label">شماره کارت</span>
            <div style="font-size:22px; font-weight:900; letter-spacing:2px; direction:ltr; margin-top:4px;">5047061674676966</div>
          </div>
        </div>
        <button class="btn-glass" onclick="copyCard()">کپی شماره کارت</button>
        
        <div style="margin-top:16px; background:rgba(10,132,255,0.08); padding:16px; border-radius:16px;">
          <div class="label">مبلغ دقیق قابل پرداخت</div>
          <div id="dynamic-amount" class="amount-display" style="margin-top:4px;">۳,۷۸۰,۰۰۰ <span style="font-size:16px;">تومان</span></div>
          <div id="amount-desc" class="label" style="margin-top:4px;">پرداخت یکجا</div>
        </div>
      </div>

      <!-- Upload Receipt -->
      <div class="glass-card">
        <div class="value-md">ارسال رسید پرداخت</div>
        <div class="label" style="margin-bottom:16px;">پس از انجام واریز، تصویر رسید خود را بارگذاری کنید.</div>
        
        <div id="upload-preview" class="hidden file-preview">
          <img id="preview-img" src="">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="text-align:right;">
              <div id="file-name" class="value-sm" style="font-size:12px;"></div>
              <div id="file-size" class="label" style="font-size:10px;"></div>
            </div>
            <button onclick="removeReceipt()" style="width:auto; padding:8px 16px; background:rgba(239,68,68,0.1); color:var(--danger); border-radius:12px; font-size:12px;">حذف</button>
          </div>
          <button id="submit-btn" class="btn-primary" onclick="uploadReceipt()">ارسال رسید برای بررسی</button>
        </div>

        <div id="upload-box-container">
          <label class="upload-box">
            <div style="font-size:28px;">📎</div>
            <div style="font-size:14px; font-weight:700; color:var(--brand);">بارگذاری تصویر رسید</div>
            <div class="label" style="font-size:11px;">JPG, PNG, WEBP (حداکثر ۸MB)</div>
            <input type="file" id="receiptFile" accept="image/*" style="display:none;" onchange="handleFile(event)">
          </label>
        </div>
      </div>

      <!-- Success Message -->
      <div id="success-msg" class="glass-card hidden" style="border-color:var(--success);">
        <div style="font-size:40px; margin-bottom:10px;">✅</div>
        <div class="value-md" style="color:var(--success);">رسید با موفقیت ارسال شد</div>
        <div class="label" style="margin-top:8px;">رسید شما در حال بررسی توسط پشتیبانی است.</div>
      </div>

    </div>
  </div>
</div>

<script>
  let currentMethod = 'full';
  let currentUsername = '';
  let receiptBase64 = '';
  let receiptFile = null;

  window.onload = async function() {
    if (!window.Telegram || !window.Telegram.WebApp) {
      return showError('اسکریپت تلگرام لود نشد.');
    }
    
    const tgWebApp = window.Telegram.WebApp;
    tgWebApp.expand();
    tgWebApp.enableClosingConfirmation();
    
    const initData = tgWebApp.initData;

    if (!initData) {
      return showError('اطلاعات تلگرام یافت نشد. لطفاً از ربات وارد شوید.');
    }

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData })
      });
      
      if (!res.ok) throw new Error('Server response not ok');

      const data = await res.json();
      if (data.success) {
        currentUsername = data.user.username;
        document.getElementById('userNameDisplay').innerText = data.user.name;
        
        // Hide loading, show main
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('main-section').classList.remove('hidden');
      } else {
        showError('خطا در احراز هویت: ' + (data.message || 'نامشخص'));
      }
    } catch (e) {
      showError('خطا در ارتباط با سرور.');
    }
  };

  function showError(msg) {
    document.getElementById('loading-section').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');
    document.getElementById('error-message').innerText = msg;
  }

  function setMethod(method) {
    currentMethod = method;
    document.getElementById('m-full').classList.remove('active');
    document.getElementById('m-inst').classList.remove('active');
    document.getElementById('m-' + (method === 'full' ? 'full' : 'inst')).classList.add('active');

    const amountEl = document.getElementById('dynamic-amount');
    const descEl = document.getElementById('amount-desc');
    const instSection = document.getElementById('installment-section');

    // Animate amount change
    amountEl.classList.remove('fade-transition');
    void amountEl.offsetWidth;
    amountEl.classList.add('fade-transition');

    if (method === 'full') {
      amountEl.innerHTML = '۳,۷۸۰,۰۰۰ <span style="font-size:16px;">تومان</span>';
      descEl.innerText = 'پرداخت یکجا';
      instSection.classList.add('hidden');
    } else {
      amountEl.innerHTML = '۹۴۵,۰۰۰ <span style="font-size:16px;">تومان</span>';
      descEl.innerText = 'قسط ۱ از ۴';
      instSection.classList.remove('hidden');
    }
  }

  async function copyCard() {
    try {
      await navigator.clipboard.writeText('5047061674676966');
      // Tiny toast
      const btn = event.target;
      const originalText = btn.innerText;
      btn.innerText = 'کپی شد ✓';
      setTimeout(() => { btn.innerText = originalText; }, 2000);
    } catch (e) { alert('کپی نشد'); }
  }

  function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return alert('حجم فایل بیش از ۸ مگابایت است');

    receiptFile = file;
    
    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
      receiptBase64 = e.target.result;
      document.getElementById('preview-img').src = receiptBase64;
      document.getElementById('file-name').innerText = file.name;
      document.getElementById('file-size').innerText = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      
      document.getElementById('upload-box-container').classList.add('hidden');
      document.getElementById('upload-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function removeReceipt() {
    receiptFile = null;
    receiptBase64 = '';
    document.getElementById('receiptFile').value = '';
    document.getElementById('upload-box-container').classList.remove('hidden');
    document.getElementById('upload-preview').classList.add('hidden');
  }

  async function uploadReceipt() {
    if (!receiptBase64) return alert('لطفاً عکس رسید را انتخاب کنید');
    
    const btn = document.getElementById('submit-btn');
    btn.innerText = 'در حال ارسال...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          method: currentMethod,
          amount: currentMethod === 'full' ? '3780000' : '945000',
          imageBase64: receiptBase64
        })
      });
      const data = await res.json();
      
      if (data.success) {
        document.getElementById('upload-preview').classList.add('hidden');
        document.getElementById('success-msg').classList.remove('hidden');
      } else {
        alert('خطا: ' + data.message);
        btn.innerText = 'ارسال رسید برای بررسی';
        btn.disabled = false;
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور');
      btn.innerText = 'ارسال رسید برای بررسی';
      btn.disabled = false;
    }
  }
</script>
</body>
</html>
`;

// ==========================================
// API Routes
// ==========================================

app.get('/', (req, res) => {
  res.send(htmlContent);
});

function verifyTelegramWebAppData(telegramInitData) {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  initData.delete('hash');
  const dataCheckString = Array.from(initData.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return calculatedHash === hash;
}

app.post('/api/auth/telegram', (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData || !verifyTelegramWebAppData(initData)) {
      return res.status(401).json({ success: false, message: 'اطلاعات تلگرام نامعتبر است' });
    }
    const tgUser = JSON.parse(new URLSearchParams(initData).get('user'));
    res.json({ success: true, user: { id: tgUser.id, name: tgUser.first_name, username: tgUser.username || 'user' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطای سرور: ' + error.message });
  }
});

app.post('/api/upload-receipt', async (req, res) => {
  try {
    const { username, amount, method, imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'عکسی ارسال نشد' });
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    
    // ساخت پیام برای تلگرام
    const methodText = method === 'installment' ? 'اقساطی' : 'کامل';
    const caption = `🧾 رسید پرداخت جدید\n\n👤 نام کاربر: ${username}\n💰 مبلغ: ${amount} تومان\n💳 روش پرداخت: ${methodText}\n\nوضعیت: در انتظار بررسی`;
    
    formData.append('caption', caption);
    formData.append('photo', blob, 'receipt.jpg');
    
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
    const tgData = await tgRes.json();
    
    if (tgData.ok) {
      res.json({ success: true, message: 'رسید به تلگرام ارسال شد' });
    } else {
      res.status(500).json({ success: false, message: 'خطای تلگرام: ' + tgData.description });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ارسال: ' + error.message });
  }
});

module.exports = app;
