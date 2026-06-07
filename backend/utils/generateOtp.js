// ---------------------------------------------------------------------------
//  generateOtp — 6 xonali (100000–999999) tasdiqlash kodini string sifatida
//  qaytaradi. Boshida nol yo'qolib qolmasligi uchun har doim 6 xonali bo'ladi.
// ---------------------------------------------------------------------------
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = generateOtp;
