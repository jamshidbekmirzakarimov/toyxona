const { pool } = require('../config/db');

// ---------------------------------------------------------------------------
//  StatsModel — admin va owner panellari uchun statistika.
// ---------------------------------------------------------------------------
const StatsModel = {
  // Admin: butun tizim bo'yicha
  async adminStats() {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM venues) AS venues_total,
        (SELECT COUNT(*) FROM venues WHERE status = 'tasdiqlangan') AS venues_approved,
        (SELECT COUNT(*) FROM venues WHERE status = 'tasdiqlanmagan') AS venues_pending,
        (SELECT COUNT(*) FROM users WHERE role = 'owner') AS owners_total,
        (SELECT COUNT(*) FROM bookings) AS bookings_total,
        (SELECT COUNT(*) FROM bookings WHERE status = 'endi bo''ladigan') AS bookings_active,
        (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'endi bo''ladigan') AS revenue_active,
        (SELECT COALESCE(SUM(advance_paid), 0) FROM bookings WHERE status = 'endi bo''ladigan') AS advance_active
    `);
    return rows[0];
  },

  // Owner: faqat o'z to'yxonalari bo'yicha
  async ownerStats(ownerId) {
    const { rows } = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM venues WHERE owner_id = $1) AS venues_total,
        (SELECT COUNT(*) FROM venues WHERE owner_id = $1 AND status = 'tasdiqlangan') AS venues_approved,
        (SELECT COUNT(*) FROM bookings b JOIN venues v ON v.id = b.venue_id
           WHERE v.owner_id = $1) AS bookings_total,
        (SELECT COUNT(*) FROM bookings b JOIN venues v ON v.id = b.venue_id
           WHERE v.owner_id = $1 AND b.status = 'endi bo''ladigan') AS bookings_active,
        (SELECT COALESCE(SUM(b.total_price), 0) FROM bookings b JOIN venues v ON v.id = b.venue_id
           WHERE v.owner_id = $1 AND b.status = 'endi bo''ladigan') AS revenue_active,
        (SELECT COALESCE(SUM(b.advance_paid), 0) FROM bookings b JOIN venues v ON v.id = b.venue_id
           WHERE v.owner_id = $1 AND b.status = 'endi bo''ladigan') AS advance_active
    `,
      [ownerId]
    );
    return rows[0];
  },
};

module.exports = StatsModel;
