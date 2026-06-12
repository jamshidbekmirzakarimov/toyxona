const nodemailer = require('nodemailer');

// ---------------------------------------------------------------------------
//  Email yuborish — IKKI rejim:
//   1) BREVO_API_KEY bor bo'lsa  -> Brevo HTTP API (port 443).
//      Bulut hostlar (Render) SMTP'ni bloklaganda ham ISHLAYDI. PRODUCTION uchun.
//   2) Aks holda                 -> Nodemailer SMTP (Gmail). LOKAL dev uchun.
// ---------------------------------------------------------------------------
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const useBrevo = Boolean(BREVO_API_KEY);

// SMTP transporter (lokal / Brevo yo'q bo'lsa)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // 465 -> SSL, 587 -> STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    // Gmail "app password" probellar bilan ko'rsatiladi — olib tashlaymiz
    pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, ''),
  },
});

// EMAIL_FROM ("Nom <email>") ni { name, email } ga ajratadi
function parseFrom() {
  const raw = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: (m[1].trim() || "To'yxona"), email: m[2].trim() };
  return { name: "To'yxona", email: raw.trim() };
}

function otpHtml(code) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>To'yxona Bron Tizimi</h2>
      <p>Hurmatli foydalanuvchi, akkauntingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2c3e50;">${code}</p>
      <p style="color: #888;">Kod <b>5 daqiqa</b> davomida amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarga e'tibor bermang.</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
//  verifyEmailConfig — server start paytida chaqiriladi (xato bo'lsa to'xtatmaydi)
// ---------------------------------------------------------------------------
async function verifyEmailConfig() {
  if (useBrevo) {
    console.log('✅ Email: Brevo (HTTP API) rejimi yoqilgan');
    return;
  }
  try {
    await transporter.verify();
    console.log('✅ Email (SMTP) ulanishi tayyor');
  } catch (err) {
    console.warn('⚠️  Email (SMTP) sozlamasi tekshirilmadi:', err.message);
  }
}

// --- Brevo HTTP API orqali yuborish ---
async function sendViaBrevo(to, subject, html, text) {
  const sender = parseFrom();
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
//  sendOtpEmail — 6 xonali OTP kodini yuboradi (Brevo yoki SMTP)
// ---------------------------------------------------------------------------
async function sendOtpEmail(to, code) {
  const subject = "To'yxona — Tasdiqlash kodi (OTP)";
  const text = `Sizning tasdiqlash kodingiz: ${code}\nKod 5 daqiqa davomida amal qiladi.`;
  const html = otpHtml(code);

  try {
    if (useBrevo) {
      await sendViaBrevo(to, subject, html, text);
    } else {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
      });
    }
  } catch (err) {
    // Render loglarida asl xatoni ko'rsatish uchun
    console.error('❌ Email yuborib bo\'lmadi:', err.message);
    throw err;
  }
}

module.exports = { transporter, verifyEmailConfig, sendOtpEmail };
