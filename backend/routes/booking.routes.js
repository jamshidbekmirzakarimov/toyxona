const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingRules } = require('../validators/booking.validator');
const { createBooking, cancelBooking, getMyBookings } = require('../controllers/booking.controller');

// ---------------------------------------------------------------------------
//  /api/bookings — barchasi avtorizatsiya talab qiladi (protect)
// ---------------------------------------------------------------------------

// Joriy foydalanuvchining bronlari ('/:id' dan oldin turishi shart emas, lekin
// aniqlik uchun yuqorida)
router.get('/my', protect, getMyBookings);

// Yangi bron yaratish
router.post('/', protect, createBookingRules, validate, createBooking);

// Bronni bekor qilish (egasi / bron qilgan user / admin)
router.delete('/:id', protect, cancelBooking);

module.exports = router;
