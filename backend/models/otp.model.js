const db = require('../config/db');

// ---------------------------------------------------------------------------
//  OtpModel — otp_codes jadvali bilan ishlovchi so'rovlar.
// ---------------------------------------------------------------------------
const OtpModel = {
  // Yangi OTP kod yozish (expiresAt — Date obyekti yoki ISO string)
  async create({ userId, code, expiresAt }) {
    const { rows } = await db.query(
      `INSERT INTO otp_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, code, expiresAt]
    );
    return rows[0];
  },

  // Foydalanuvchining eng oxirgi (eng yangi) OTP kodini olish
  async findLatestByUserId(userId) {
    const { rows } = await db.query(
      `SELECT * FROM otp_codes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0];
  },

  // Foydalanuvchining barcha OTP kodlarini o'chirish (yangisini yozishdan
  // oldin yoki tasdiqlangandan keyin tozalash uchun)
  async deleteByUserId(userId) {
    await db.query('DELETE FROM otp_codes WHERE user_id = $1', [userId]);
  },
};

module.exports = OtpModel;
