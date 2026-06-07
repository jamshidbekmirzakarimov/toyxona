const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');
const { createVenue, listVenues, getVenue, getVenueCalendar } = require('../controllers/venue.controller');

// ---------------------------------------------------------------------------
//  GET /api/venues — to'yxonalar ro'yxati (filtr / qidiruv / saralash).
//  optionalAuth: token bo'lsa o'qiydi (admin status filtridan foydalanishi uchun),
//  bo'lmasa mehmon sifatida faqat 'tasdiqlangan' to'yxonalar qaytadi.
// ---------------------------------------------------------------------------
router.get('/', optionalAuth, listVenues);

// ---------------------------------------------------------------------------
//  GET /api/venues/:id/calendar — bron kalendari (kelgusi 12 oy).
//  ':id' dan oldin turishi shart emas (turli segment soni), lekin aniqligi
//  uchun yuqorida turadi.
// ---------------------------------------------------------------------------
router.get('/:id/calendar', optionalAuth, getVenueCalendar);

// ---------------------------------------------------------------------------
//  GET /api/venues/:id — yakka to'yxona to'liq ma'lumoti + bronlar
// ---------------------------------------------------------------------------
router.get('/:id', optionalAuth, getVenue);

// ---------------------------------------------------------------------------
//  POST /api/venues — to'yxona qo'shish (faqat admin yoki owner)
//
//  Ketma-ketlik muhim:
//    1) protect      — JWT tekshiradi (req.user)
//    2) authorize    — admin/owner ekanini tekshiradi
//    3) upload.fields— multipart/form-data ni parse qiladi (rasmlar + req.body)
//    4) createVenue  — validatsiya + transaction
// ---------------------------------------------------------------------------
router.post(
  '/',
  protect,
  authorize('admin', 'owner'),
  upload.fields([
    { name: 'images', maxCount: 10 }, // to'yxona suratlari
    { name: 'singerImages', maxCount: 20 }, // honanda suratlari (singers tartibida)
    { name: 'carImages', maxCount: 20 }, // mashina suratlari (cars tartibida)
  ]),
  createVenue
);

module.exports = router;
