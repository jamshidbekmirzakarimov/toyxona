const nodemailer = require('nodemailer');

// ---------------------------------------------------------------------------
//  Nodemailer transporter — SMTP credentials .env dan olinadi.
//  Port 465 -> SSL (secure: true), 587 -> STARTTLS (secure: false).
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    // Gmail "app password" probellar bilan ko'rsatiladi — ularni olib tashlaymiz
    pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, ''),
  },
});

// ---------------------------------------------------------------------------
//  verifyEmailConfig — server start paytida SMTP sozlamasini tekshirish.
//  Xato bo'lsa ham serverni to'xtatmaydi (faqat ogohlantiradi).
// ---------------------------------------------------------------------------
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email (SMTP) ulanishi tayyor');
  } catch (err) {
    console.warn('⚠️  Email (SMTP) sozlamasi tekshirilmadi:', err.message);
  }
}

// ---------------------------------------------------------------------------
//  sendOtpEmail — foydalanuvchiga 6 xonali OTP kodini yuboradi.
// ---------------------------------------------------------------------------
async function sendOtpEmail(to, code) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "To'yxona — Tasdiqlash kodi (OTP)",
      text: `Sizning tasdiqlash kodingiz: ${code}\nKod 5 daqiqa davomida amal qiladi.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>To'yxona Bron Tizimi</h2>
          <p>Hurmatli foydalanuvchi, akkauntingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2c3e50;">${code}</p>
          <p style="color: #888;">Kod <b>5 daqiqa</b> davomida amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarga e'tibor bermang.</p>
        </div>
      `,
    });
  } catch (err) {
    // Render loglarida ASL xatoni ko'rsatish uchun (EAUTH, ETIMEDOUT, ESOCKET, ...)
    console.error('❌ Email yuborib bo\'lmadi:', err.code || '', '-', err.message);
    throw err;
  }
}

module.exports = { transporter, verifyEmailConfig, sendOtpEmail };
