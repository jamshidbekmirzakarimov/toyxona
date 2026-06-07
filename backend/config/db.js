const { Pool } = require('pg');

// ---------------------------------------------------------------------------
//  PostgreSQL ulanish puli (connection pool)
//  Pool — bir nechta ulanishni qayta ishlatadi, har so'rovga yangi ulanish
//  ochmaydi. Bu unumdorlikni oshiradi.
// ---------------------------------------------------------------------------
// Supabase (yoki boshqa bulutli DB) — DATABASE_URL ulanish satri orqali.
// Aks holda — alohida DB_* o'zgaruvchilari orqali (lokal PostgreSQL).
const useConnectionString = Boolean(process.env.DATABASE_URL);

// Supabase SSL talab qiladi. Lokalda DB_SSL=true bo'lsa ham yoqiladi.
const sslConfig =
  useConnectionString || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

const baseOptions = {
  max: 20, // pulda maksimal ulanishlar soni
  idleTimeoutMillis: 30000, // bo'sh ulanish 30s dan keyin yopiladi
  connectionTimeoutMillis: 10000, // ulanishni kutish vaqti (bulut uchun kengroq)
  ssl: sslConfig,
};

const pool = new Pool(
  useConnectionString
    ? { connectionString: process.env.DATABASE_URL, ...baseOptions }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ...baseOptions,
      }
);

// Kutilmagan pul xatosi (masalan, baza qayta yuklanganda)
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pul xatosi:', err.message);
});

// ---------------------------------------------------------------------------
//  Ulanishni tekshirish — server start paytida chaqiriladi
// ---------------------------------------------------------------------------
async function connectDB() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW()');
    client.release();
    console.log(`✅ PostgreSQL ulandi (server vaqti: ${rows[0].now})`);
  } catch (err) {
    console.error('❌ PostgreSQL ga ulanib bo\'lmadi:', err.message);
    throw err; // index.js da ushlanadi va process to'xtaydi
  }
}

// ---------------------------------------------------------------------------
//  Eksport: query() — barcha model'lar shu orqali so'rov yuboradi
// ---------------------------------------------------------------------------
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  connectDB,
};
