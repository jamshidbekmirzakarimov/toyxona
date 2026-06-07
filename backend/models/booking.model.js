const { pool } = require('../config/db');

// Bron qatorini qaytarishda booking_date ni toza 'YYYY-MM-DD' string qilamiz
const BOOKING_RETURNING = `
  id, venue_id, user_id,
  TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
  guest_count, total_price, advance_paid, status,
  customer_name, customer_surname, customer_phone, created_at
`;

// ---------------------------------------------------------------------------
//  BookingModel — bookings va booking_services bilan ishlovchi so'rovlar.
// ---------------------------------------------------------------------------
const BookingModel = {
  // Yangi bron + tanlangan xizmatlar (transaction bilan)
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bRes = await client.query(
        `INSERT INTO bookings
           (venue_id, user_id, booking_date, guest_count, total_price, advance_paid,
            status, customer_name, customer_surname, customer_phone)
         VALUES ($1, $2, $3, $4, $5, $6, 'endi bo''ladigan', $7, $8, $9)
         RETURNING ${BOOKING_RETURNING}`,
        [
          data.venue_id,
          data.user_id,
          data.booking_date,
          data.guest_count,
          data.total_price,
          data.advance_paid,
          data.customer_name,
          data.customer_surname,
          data.customer_phone,
        ]
      );
      const booking = bRes.rows[0];

      // Tanlangan xizmatlar (singer/car) — har biri bitta qator
      const services = [];
      for (const s of data.services) {
        const r = await client.query(
          `INSERT INTO booking_services (booking_id, service_kind, singer_id, car_id, price)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            booking.id,
            s.kind,
            s.kind === 'singer' ? s.id : null,
            s.kind === 'car' ? s.id : null,
            s.price,
          ]
        );
        services.push(r.rows[0]);
      }

      await client.query('COMMIT');
      return { ...booking, services };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Shu to'yxona + sana uchun AKTIV bron bormi? (oldindan tekshirish)
  async findActiveByVenueAndDate(venueId, date) {
    const { rows } = await pool.query(
      `SELECT id FROM bookings
       WHERE venue_id = $1 AND booking_date = $2 AND status = 'endi bo''ladigan'`,
      [venueId, date]
    );
    return rows[0];
  },

  // Bitta bron (ruxsat tekshirish uchun — user_id, venue_id, status kerak)
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return rows[0];
  },

  // Bronni bekor qilish (soft-cancel: status o'zgaradi, sana bo'shaydi)
  async cancel(id) {
    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'bekor qilingan'
       WHERE id = $1
       RETURNING ${BOOKING_RETURNING}`,
      [id]
    );
    return rows[0];
  },

  // Foydalanuvchining bronlari (to'yxona nomi/rayoni bilan)
  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
         b.guest_count, b.total_price, b.advance_paid, b.status,
         b.customer_name, b.customer_surname, b.customer_phone, b.created_at,
         v.id AS venue_id, v.name AS venue_name, v.district AS venue_district
       FROM bookings b
       JOIN venues v ON v.id = b.venue_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    return rows;
  },

  // Owner'ning BARCHA to'yxonalaridagi bronlar (jadval ko'rinishi uchun)
  async findByOwnerId(ownerId) {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
         b.guest_count, b.total_price, b.advance_paid, b.status,
         b.customer_name, b.customer_surname, b.customer_phone, b.created_at,
         v.id AS venue_id, v.name AS venue_name, v.district AS venue_district
       FROM bookings b
       JOIN venues v ON v.id = b.venue_id
       WHERE v.owner_id = $1
       ORDER BY b.booking_date DESC`,
      [ownerId]
    );
    return rows;
  },

  // -------------------------------------------------------------------------
  //  findAll — admin uchun barcha bronlar (filtr/sort bilan).
  //  Filtrlar parametrli ($1, $2, ...); saralash ustuni WHITELIST orqali.
  // -------------------------------------------------------------------------
  async findAll({ date, venueId, district, status, sortBy, order } = {}) {
    const where = [];
    const params = [];
    let i = 1;

    if (date) {
      where.push(`b.booking_date = $${i++}`);
      params.push(date);
    }
    if (venueId) {
      where.push(`b.venue_id = $${i++}`);
      params.push(venueId);
    }
    if (district) {
      where.push(`v.district = $${i++}`);
      params.push(district);
    }
    if (status) {
      where.push(`b.status = $${i++}`);
      params.push(status);
    }

    // Saralash — whitelist (identifikatorni parametrlab bo'lmaydi)
    const SORT_COLUMNS = {
      date: 'b.booking_date',
      venue: 'v.name',
      district: 'v.district',
      status: 'b.status',
      total: 'b.total_price',
      created: 'b.created_at',
    };
    const sortColumn = SORT_COLUMNS[sortBy] || 'b.booking_date';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        b.id,
        TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
        b.guest_count, b.total_price, b.advance_paid, b.status,
        b.customer_name, b.customer_surname, b.customer_phone, b.created_at,
        b.user_id,
        v.id AS venue_id, v.name AS venue_name, v.district AS venue_district
      FROM bookings b
      JOIN venues v ON v.id = b.venue_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
    `;

    const { rows } = await pool.query(sql, params);
    return rows;
  },
};

module.exports = BookingModel;
