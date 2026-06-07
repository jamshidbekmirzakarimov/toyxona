const db = require('../config/db');

// ---------------------------------------------------------------------------
//  UserModel — users jadvali bilan ishlovchi so'rovlar.
//  Eslatma: parol (password) faqat login solishtiruvida kerak, shuning uchun
//  findByUsername to'liq qatorni qaytaradi; qolgan metodlar parolsiz qaytaradi.
// ---------------------------------------------------------------------------

// Parolsiz qaytariladigan ustunlar (xavfsiz tanlov)
const SAFE_COLUMNS = 'id, name, surname, email, username, role, is_verified, created_at';

const UserModel = {
  // Yangi foydalanuvchi yaratish (password allaqachon hashlangan bo'lishi kerak)
  async create({ name, surname, email, username, password, role = 'user' }) {
    const { rows } = await db.query(
      `INSERT INTO users (name, surname, email, username, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SAFE_COLUMNS}`,
      [name, surname, email, username, password, role]
    );
    return rows[0];
  },

  // Login uchun — parol (hash) bilan birga to'liq qator qaytaradi
  async findByUsername(username) {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
  },

  // Email bo'yicha qidirish (parolsiz). Register'da takror tekshirish va
  // OTP verifikatsiyada role/is_verified ni olish uchun ishlatiladi.
  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE email = $1`,
      [email]
    );
    return rows[0];
  },

  // protect middleware'ida foydalanuvchi hali mavjudligini tekshirish uchun (parolsiz)
  async findById(id) {
    const { rows } = await db.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0];
  },

  // Foydalanuvchini tasdiqlangan (is_verified = TRUE) deb belgilash
  async setVerified(id) {
    const { rows } = await db.query(
      `UPDATE users SET is_verified = TRUE WHERE id = $1 RETURNING ${SAFE_COLUMNS}`,
      [id]
    );
    return rows[0];
  },

  // Barcha to'yxona egalari (admin uchun, parolsiz)
  async findOwners() {
    const { rows } = await db.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE role = 'owner' ORDER BY created_at DESC`
    );
    return rows;
  },
};

module.exports = UserModel;
