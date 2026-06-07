const { pool } = require('../config/db');

// ---------------------------------------------------------------------------
//  VenueModel — to'yxona va unga bog'liq jadvallarni TRANSACTION bilan yozadi.
//
//  Transaction sababi: venue + venue_images + singers + cars + menu_items +
//  karnay_surnay — hammasi BIRGA muvaffaqiyatli yozilishi yoki BIRGA bekor
//  qilinishi kerak (yarim yozilgan to'yxona qolmasligi uchun).
// ---------------------------------------------------------------------------
const VenueModel = {
  async createWithRelations(data) {
    const client = await pool.connect(); // transaction uchun bitta klient

    try {
      await client.query('BEGIN');

      // --- 1) Asosiy to'yxona yozuvi ---
      const venueRes = await client.query(
        `INSERT INTO venues
           (name, district, address, capacity, price_per_seat, phone, description, status, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.name,
          data.district,
          data.address,
          data.capacity,
          data.price_per_seat,
          data.phone,
          data.description,
          data.status,
          data.owner_id,
        ]
      );
      const venue = venueRes.rows[0];

      // --- 2) To'yxona suratlari ---
      const images = [];
      for (const url of data.images) {
        const r = await client.query(
          'INSERT INTO venue_images (venue_id, image_url) VALUES ($1, $2) RETURNING *',
          [venue.id, url]
        );
        images.push(r.rows[0]);
      }

      // --- 3) Honandalar (singers) ---
      const singers = [];
      for (const s of data.singers) {
        const r = await client.query(
          'INSERT INTO singers (venue_id, name, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [venue.id, s.name, s.price, s.image_url]
        );
        singers.push(r.rows[0]);
      }

      // --- 4) Mashinalar (cars) ---
      const cars = [];
      for (const c of data.cars) {
        const r = await client.query(
          'INSERT INTO cars (venue_id, brand, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [venue.id, c.brand, c.price, c.image_url]
        );
        cars.push(r.rows[0]);
      }

      // --- 5) Menyu (menu_items) ---
      const menu_items = [];
      for (const name of data.menu_items) {
        const r = await client.query(
          'INSERT INTO menu_items (venue_id, name) VALUES ($1, $2) RETURNING *',
          [venue.id, name]
        );
        menu_items.push(r.rows[0]);
      }

      // --- 6) Karnay-surnay (1:1, ixtiyoriy) ---
      let karnay_surnay = null;
      if (data.karnay_surnay) {
        const r = await client.query(
          'INSERT INTO karnay_surnay (venue_id, available, price) VALUES ($1, $2, $3) RETURNING *',
          [venue.id, data.karnay_surnay.available, data.karnay_surnay.price]
        );
        karnay_surnay = r.rows[0];
      }

      await client.query('COMMIT');

      // To'liq obyektni qaytaramiz
      return { ...venue, images, singers, cars, menu_items, karnay_surnay };
    } catch (err) {
      await client.query('ROLLBACK'); // har qanday xatoda hammasi bekor qilinadi
      throw err;
    } finally {
      client.release(); // klientni pulga qaytaramiz (majburiy)
    }
  },

  // -------------------------------------------------------------------------
  //  findAll — filtr / qidiruv / saralash bilan to'yxonalar ro'yxati.
  //  Har bir to'yxona bilan birinchi surati (thumbnail) qaytadi.
  //
  //  Xavfsizlik:
  //   - barcha foydalanuvchi qiymatlari parametrli ($1, $2, ...) yuboriladi;
  //   - saralash ustuni/yo'nalishi WHITELIST orqali tanlanadi (identifikatorni
  //     parametrlab bo'lmaydi — bu SQL injection oldini olishning yagona to'g'ri yo'li).
  //
  //  Eslatma: bu yerga keladigan `status` controller'da allaqachon
  //  ruxsat (rol) bo'yicha hal qilingan bo'ladi.
  // -------------------------------------------------------------------------
  async findAll({ search, district, status, sortBy, order } = {}) {
    const where = [];
    const params = [];
    let i = 1;

    if (status) {
      where.push(`v.status = $${i++}`);
      params.push(status);
    }
    if (search) {
      where.push(`v.name ILIKE $${i++}`); // qisman moslik, katta-kichik harfga sezgir emas
      params.push(`%${search}%`);
    }
    if (district) {
      where.push(`v.district = $${i++}`);
      params.push(district);
    }

    // Saralash — faqat ruxsat etilgan ustunlar (whitelist)
    const SORT_COLUMNS = { price: 'v.price_per_seat', capacity: 'v.capacity' };
    const sortColumn = SORT_COLUMNS[sortBy] || 'v.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        v.*,
        (
          SELECT vi.image_url
          FROM venue_images vi
          WHERE vi.venue_id = v.id
          ORDER BY vi.id ASC
          LIMIT 1
        ) AS thumbnail
      FROM venues v
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
    `;

    const { rows } = await pool.query(sql, params);
    return rows;
  },

  // -------------------------------------------------------------------------
  //  findById — bitta to'yxonaning asosiy yozuvi (ko'rish huquqini tekshirish uchun)
  // -------------------------------------------------------------------------
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM venues WHERE id = $1', [id]);
    return rows[0];
  },

  // Owner'ning O'Z to'yxonalari (barcha statuslar — tasdiqlanmaganlar ham).
  // Har biriga thumbnail (birinchi surat) qo'shiladi.
  async findByOwner(ownerId) {
    const { rows } = await pool.query(
      `SELECT
         v.*,
         (
           SELECT vi.image_url FROM venue_images vi
           WHERE vi.venue_id = v.id ORDER BY vi.id ASC LIMIT 1
         ) AS thumbnail
       FROM venues v
       WHERE v.owner_id = $1
       ORDER BY v.created_at DESC`,
      [ownerId]
    );
    return rows;
  },

  // -------------------------------------------------------------------------
  //  findDetailById — to'liq ma'lumot: egasi, suratlar, honandalar, mashinalar,
  //  menyu, karnay-surnay va bronlar (bekor qilinganlardan tashqari).
  //  Topilmasa null qaytaradi.
  // -------------------------------------------------------------------------
  async findDetailById(id) {
    const venueRes = await pool.query(
      `SELECT v.*,
              u.name     AS owner_name,
              u.surname  AS owner_surname,
              u.username AS owner_username,
              u.email    AS owner_email
       FROM venues v
       JOIN users u ON u.id = v.owner_id
       WHERE v.id = $1`,
      [id]
    );
    const venue = venueRes.rows[0];
    if (!venue) return null;

    // Bog'liq jadvallarni parallel o'qiymiz
    const [images, singers, cars, menu, karnay, bookings] = await Promise.all([
      pool.query('SELECT * FROM venue_images WHERE venue_id = $1 ORDER BY id', [id]),
      pool.query('SELECT * FROM singers WHERE venue_id = $1 ORDER BY id', [id]),
      pool.query('SELECT * FROM cars WHERE venue_id = $1 ORDER BY id', [id]),
      pool.query('SELECT * FROM menu_items WHERE venue_id = $1 ORDER BY id', [id]),
      pool.query('SELECT * FROM karnay_surnay WHERE venue_id = $1', [id]),
      pool.query(
        `SELECT id,
                TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date,
                guest_count,
                status,
                customer_name,
                customer_surname,
                customer_phone,
                total_price,
                advance_paid,
                created_at
         FROM bookings
         WHERE venue_id = $1 AND status <> 'bekor qilingan'
         ORDER BY booking_date`,
        [id]
      ),
    ]);

    // Egasi ma'lumotini alohida obyektga ajratamiz
    const { owner_name, owner_surname, owner_username, owner_email, ...venueFields } = venue;

    return {
      ...venueFields,
      owner: {
        id: venue.owner_id,
        name: owner_name,
        surname: owner_surname,
        username: owner_username,
        email: owner_email,
      },
      images: images.rows,
      singers: singers.rows,
      cars: cars.rows,
      menu_items: menu.rows,
      karnay_surnay: karnay.rows[0] || null,
      bookings: bookings.rows,
    };
  },

  // -------------------------------------------------------------------------
  //  findBookedDates — kalendar uchun aktiv ('endi bo'ladigan') bron sanalari.
  //  Sanalar 'YYYY-MM-DD' string sifatida qaytadi (vaqt zonasi siljishisiz).
  // -------------------------------------------------------------------------
  async findBookedDates(id) {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(booking_date, 'YYYY-MM-DD') AS date
       FROM bookings
       WHERE venue_id = $1 AND status = 'endi bo''ladigan'`,
      [id]
    );
    return rows.map((r) => r.date);
  },

  // -------------------------------------------------------------------------
  //  Bron narxini hisoblash uchun: tanlangan honanda/mashina/karnay yozuvlari.
  //  venue_id sharti tanlangan xizmat ayni shu to'yxonaga tegishli ekanini
  //  kafolatlaydi (boshqa to'yxona xizmatini qo'shib bo'lmaydi).
  // -------------------------------------------------------------------------
  async getSingersByIds(venueId, ids) {
    const { rows } = await pool.query(
      'SELECT id, name, price FROM singers WHERE venue_id = $1 AND id = ANY($2::int[])',
      [venueId, ids]
    );
    return rows;
  },

  async getCarsByIds(venueId, ids) {
    const { rows } = await pool.query(
      'SELECT id, brand, price FROM cars WHERE venue_id = $1 AND id = ANY($2::int[])',
      [venueId, ids]
    );
    return rows;
  },

  async getKarnay(venueId) {
    const { rows } = await pool.query(
      'SELECT * FROM karnay_surnay WHERE venue_id = $1',
      [venueId]
    );
    return rows[0];
  },

  // -------------------------------------------------------------------------
  //  update — to'yxonaning asosiy (skalyar) maydonlarini yangilash.
  //  Suratlar/honanda/mashina/menyu kabi bog'liq jadvallar bu yerda
  //  o'zgartirilmaydi (ular alohida boshqariladi).
  // -------------------------------------------------------------------------
  async update(id, data) {
    const { rows } = await pool.query(
      `UPDATE venues
         SET name = $1,
             district = $2,
             address = $3,
             capacity = $4,
             price_per_seat = $5,
             phone = $6,
             description = $7
       WHERE id = $8
       RETURNING *`,
      [
        data.name,
        data.district,
        data.address,
        data.capacity,
        data.price_per_seat,
        data.phone,
        data.description,
        id,
      ]
    );
    return rows[0];
  },

  // -------------------------------------------------------------------------
  //  Admin amallari
  // -------------------------------------------------------------------------

  // Egani biriktirish
  async assignOwner(id, ownerId) {
    const { rows } = await pool.query(
      'UPDATE venues SET owner_id = $1 WHERE id = $2 RETURNING *',
      [ownerId, id]
    );
    return rows[0];
  },

  // Statusni o'zgartirish (masalan 'tasdiqlangan')
  async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE venues SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  },

  // O'chirishdan oldin bog'liq rasm URL larini yig'ish (disk faylларни tozalash uchun)
  async getImagePaths(id) {
    const { rows } = await pool.query(
      `SELECT image_url FROM venue_images WHERE venue_id = $1
       UNION ALL
       SELECT image_url FROM singers WHERE venue_id = $1 AND image_url IS NOT NULL
       UNION ALL
       SELECT image_url FROM cars WHERE venue_id = $1 AND image_url IS NOT NULL`,
      [id]
    );
    return rows.map((r) => r.image_url);
  },

  // To'yxonani o'chirish (FK ON DELETE CASCADE bog'liq jadvallarni ham o'chiradi)
  async delete(id) {
    const { rows } = await pool.query('DELETE FROM venues WHERE id = $1 RETURNING id', [id]);
    return rows[0];
  },

  // -------------------------------------------------------------------------
  //  updateWithServices — to'yxona + xizmatlarni (singers/cars/menu/karnay)
  //  TRANSACTION ichida tahrirlash. Xizmatlar "replace-all" usulida:
  //  eskilari o'chirilib, yangilari yoziladi.
  //
  //  DIQQAT: singers/cars o'chirilganda ularga bog'langan booking_services
  //  qatorlari ham (ON DELETE CASCADE) o'chadi — ya'ni eski bronlardagi
  //  xizmat yozuvlari yo'qoladi. Bu admin tahriri uchun ataylab qabul qilingan.
  // -------------------------------------------------------------------------
  async updateWithServices(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const vRes = await client.query(
        `UPDATE venues
           SET name = $1, district = $2, address = $3, capacity = $4,
               price_per_seat = $5, phone = $6, description = $7
         WHERE id = $8
         RETURNING *`,
        [
          data.name,
          data.district,
          data.address,
          data.capacity,
          data.price_per_seat,
          data.phone,
          data.description,
          id,
        ]
      );
      const venue = vRes.rows[0];
      if (!venue) {
        await client.query('ROLLBACK');
        return null;
      }

      // singers
      await client.query('DELETE FROM singers WHERE venue_id = $1', [id]);
      const singers = [];
      for (const s of data.singers) {
        const r = await client.query(
          'INSERT INTO singers (venue_id, name, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [id, s.name, s.price, s.image_url]
        );
        singers.push(r.rows[0]);
      }

      // cars
      await client.query('DELETE FROM cars WHERE venue_id = $1', [id]);
      const cars = [];
      for (const c of data.cars) {
        const r = await client.query(
          'INSERT INTO cars (venue_id, brand, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [id, c.brand, c.price, c.image_url]
        );
        cars.push(r.rows[0]);
      }

      // menu_items
      await client.query('DELETE FROM menu_items WHERE venue_id = $1', [id]);
      const menu_items = [];
      for (const name of data.menu_items) {
        const r = await client.query(
          'INSERT INTO menu_items (venue_id, name) VALUES ($1, $2) RETURNING *',
          [id, name]
        );
        menu_items.push(r.rows[0]);
      }

      // karnay_surnay (replace)
      await client.query('DELETE FROM karnay_surnay WHERE venue_id = $1', [id]);
      let karnay_surnay = null;
      if (data.karnay_surnay) {
        const r = await client.query(
          'INSERT INTO karnay_surnay (venue_id, available, price) VALUES ($1, $2, $3) RETURNING *',
          [id, data.karnay_surnay.available, data.karnay_surnay.price]
        );
        karnay_surnay = r.rows[0];
      }

      await client.query('COMMIT');
      return { ...venue, singers, cars, menu_items, karnay_surnay };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = VenueModel;
