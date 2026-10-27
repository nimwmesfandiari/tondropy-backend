const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path'); // اضافه شده
const app = express();

const port = process.env.PORT || 9090; 

const TELEGRAM_BOT_TOKEN = "8959966218:AAH6lNe8K4UVAeDGJATBdf9Y877SKxPYkho"; 
const TELEGRAM_CHAT_ID = "5972276401";

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// این خط به سرور می‌گوید فایل‌های استاتیک را از کجا بخواند
app.use(express.static(path.join(__dirname, 'public')));

// این خط تضمین می‌کند که وقتی کاربر وارد سایت می‌شود، فایل HTML باز شود
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function verifyTelegramWebAppData(telegramInitData) {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  initData.delete('hash');
  const dataCheckString = Array.from(initData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return calculatedHash === hash;
}

app.post('/api/auth/telegram', (req, res) => {
  const { initData } = req.body;
  if (!initData || !verifyTelegramWebAppData(initData)) {
    return res.status(401).json({ success: false, message: 'اطلاعات تلگرام نامعتبر است' });
  }
  const urlParams = new URLSearchParams(initData);
  const userStr = urlParams.get('user');
  const tgUser = JSON.parse(userStr);
  res.json({ success: true, user: { id: tgUser.id, name: tgUser.first_name, username: tgUser.username || 'user' } });
});

app.post('/api/upload-receipt', async (req, res) => {
  const { username, amount, method, imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ success: false, message: 'عکسی ارسال نشد' });
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const caption = `🧾 رسید جدید\n👤 کاربر: ${username}\n💰 مبلغ: ${amount} تومان\n💳 روش: ${method === 'installment' ? 'اقساطی' : 'کامل'}`;
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('caption', caption);
  formData.append('photo', blob, 'receipt.jpg');
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
    res.json({ success: true, message: 'رسید به تلگرام ارسال شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ارسال' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
