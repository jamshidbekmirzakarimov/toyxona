const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createOwnerRules } = require('../validators/admin.validator');
const {
  createOwner,
  listOwners,
  assignVenueOwner,
  approveVenue,
  deleteVenue,
  editVenue,
  listAllBookings,
  cancelAnyBooking,
  getStats,
} = require('../controllers/admin.controller');

// ---------------------------------------------------------------------------
//  Barcha /api/admin route'lari: protect + authorize('admin')
// ---------------------------------------------------------------------------
router.use(protect, authorize('admin'));

// --- Statistika ---
router.get('/stats', getStats);

// --- Egalar (owners) ---
router.post('/owners', createOwnerRules, validate, createOwner); // yangi to'yxona egasi yaratish
router.get('/owners', listOwners); // barcha egalar

// --- To'yxonalar ---
router.put('/venues/:id/assign', assignVenueOwner); // egani biriktirish
router.put('/venues/:id/approve', approveVenue); // tasdiqlash
router.put('/venues/:id', editVenue); // ma'lumot + xizmatlarni tahrirlash
router.delete('/venues/:id', deleteVenue); // o'chirish

// --- Bronlar ---
router.get('/bookings', listAllBookings); // barcha bronlar (filtr/sort)
router.delete('/bookings/:id', cancelAnyBooking); // istalgan bronni bekor qilish

module.exports = router;
