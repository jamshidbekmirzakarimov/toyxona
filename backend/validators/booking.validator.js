const { body } = require('express-validator');

// ---------------------------------------------------------------------------
//  Bron yaratish uchun express-validator zanjiri.
//  (Tanlangan xizmatlar / sig'im / sana bandligi kabi murakkab tekshiruvlar
//   controller ichida — bu yerda asosiy maydonlar tekshiriladi.)
// ---------------------------------------------------------------------------
const createBookingRules = [
  body('venue_id').isInt({ gt: 0 }).withMessage('venue_id musbat butun son bo\'lishi kerak'),
  body('booking_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('booking_date YYYY-MM-DD formatda bo\'lishi kerak'),
  body('guest_count').isInt({ gt: 0 }).withMessage('guest_count musbat butun son bo\'lishi kerak'),
  body('customer_name').trim().notEmpty().withMessage('customer_name majburiy'),
  body('customer_surname').trim().notEmpty().withMessage('customer_surname majburiy'),
  body('customer_phone')
    .trim()
    .matches(/^\+?[0-9\s\-()]{7,20}$/)
    .withMessage('customer_phone formati noto\'g\'ri'),
];

module.exports = { createBookingRules };
