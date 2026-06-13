const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');
const { createVenue } = require('../controllers/venue.controller');
const {
  getOwnerVenues,
  updateOwnVenue,
  getOwnerBookings,
  cancelOwnerBooking,
  getOwnerStats,
} = require('../controllers/owner.controller');

// ---------------------------------------------------------------------------
//  Barcha /api/owner route'lari: protect + authorize('owner')
//  (router.use orqali bir joyda qo'llaymiz)
// ---------------------------------------------------------------------------
router.use(protect, authorize('owner'));

// O'z statistikasi
router.get('/stats', getOwnerStats);

// O'z to'yxonasini ro'yxatdan o'tkazish (createVenue owner uchun
// status='tasdiqlanmagan' va owner_id=req.user.userId qo'yadi).
// multipart/form-data — rasmlar bilan.
router.post('/venues', upload.any(), createVenue);

// O'z to'yxonalari ro'yxati (statuslar bilan)
router.get('/venues', getOwnerVenues);

// Faqat o'z to'yxonasi ma'lumotini (xizmatlar bilan) tahrirlash
router.put('/venues/:id', updateOwnVenue);

// Faqat o'z to'yxonasidagi bronlar
router.get('/bookings', getOwnerBookings);

// O'z to'yxonasidagi bronni bekor qilish
router.delete('/bookings/:id', cancelOwnerBooking);

module.exports = router;
