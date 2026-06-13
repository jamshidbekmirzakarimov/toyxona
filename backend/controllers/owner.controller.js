const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const VenueModel = require('../models/venue.model');
const BookingModel = require('../models/booking.model');
const StatsModel = require('../models/stats.model');
const { validateVenue } = require('./venue.controller');

// ---------------------------------------------------------------------------
//  Yordamchilar
// ---------------------------------------------------------------------------
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

const parseId = (raw, label) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Noto'g'ri ${label}`);
  }
  return id;
};

// Berilgan to'yxona shu owner'ga tegishliligini tekshiradi (yoki xato beradi)
const getOwnedVenue = async (venueId, userId) => {
  const venue = await VenueModel.findById(venueId);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');
  if (venue.owner_id !== userId) {
    throw new ApiError(403, 'Bu to\'yxona sizga tegishli emas');
  }
  return venue;
};

// ---------------------------------------------------------------------------
//  GET /api/owner/venues — owner o'z to'yxonalari (tasdiqlanmaganlar bilan)
// ---------------------------------------------------------------------------
const getOwnerVenues = asyncHandler(async (req, res) => {
  const venues = await VenueModel.findByOwner(req.user.userId);
  res.json({ success: true, count: venues.length, venues });
});

// ---------------------------------------------------------------------------
//  PUT /api/owner/venues/:id — o'z to'yxonasini (xizmatlar bilan) tahrirlash.
//  Suratlar bu yerda o'zgartirilmaydi (JSON). Xizmatlar replace-all.
// ---------------------------------------------------------------------------
const updateOwnVenue = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'to\'yxona id');

  // Ownership tekshiruvi
  await getOwnedVenue(id, req.user.userId);

  const { name, district, address, phone, description, capacity, price_per_seat } = req.body;
  const singers = Array.isArray(req.body.singers) ? req.body.singers : [];
  const cars = Array.isArray(req.body.cars) ? req.body.cars : [];
  const menu_items = Array.isArray(req.body.menu_items) ? req.body.menu_items : [];
  const karnay_surnay = req.body.karnay_surnay != null ? req.body.karnay_surnay : null;

  // venue.controller dan qayta ishlatilgan to'liq validatsiya
  validateVenue({ name, district, address, phone, capacity, price_per_seat, singers, cars, menu_items, karnay_surnay });

  const updated = await VenueModel.updateWithServices(id, {
    name: name.trim(),
    district: district.trim(),
    address: address.trim(),
    capacity: Number(capacity),
    price_per_seat: Number(price_per_seat),
    phone: phone.trim(),
    description: isNonEmpty(description) ? description.trim() : null,
    singers: singers.map((s) => ({
      name: s.name.trim(),
      price: Number(s.price),
      image_url: isNonEmpty(s.image_url) ? s.image_url : null,
    })),
    cars: cars.map((c) => ({
      brand: c.brand.trim(),
      price: Number(c.price),
      image_url: isNonEmpty(c.image_url) ? c.image_url : null,
    })),
    menu_items: menu_items.map((m) => String(m).trim()),
    karnay_surnay: karnay_surnay
      ? { available: Boolean(karnay_surnay.available), price: Number(karnay_surnay.price) || 0 }
      : null,
  });

  res.json({ success: true, message: 'To\'yxona yangilandi', venue: updated });
});

// ---------------------------------------------------------------------------
//  GET /api/owner/bookings — owner'ning barcha to'yxonalaridagi bronlar
// ---------------------------------------------------------------------------
const getOwnerBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingModel.findByOwnerId(req.user.userId);
  res.json({ success: true, count: bookings.length, bookings });
});

// ---------------------------------------------------------------------------
//  DELETE /api/owner/bookings/:id — faqat o'z to'yxonasidagi bronni bekor qilish
// ---------------------------------------------------------------------------
const cancelOwnerBooking = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'bron id');

  const booking = await BookingModel.findById(id);
  if (!booking) throw new ApiError(404, 'Bron topilmadi');

  const venue = await VenueModel.findById(booking.venue_id);
  if (!venue || venue.owner_id !== req.user.userId) {
    throw new ApiError(403, 'Bu bron sizning to\'yxonangizga tegishli emas');
  }

  if (booking.status === 'bekor qilingan') {
    throw new ApiError(400, 'Bron allaqachon bekor qilingan');
  }
  if (booking.status === 'bo\'lib o\'tgan') {
    throw new ApiError(400, 'O\'tib ketgan bronni bekor qilib bo\'lmaydi');
  }

  const cancelled = await BookingModel.cancel(id);

  res.json({ success: true, message: 'Bron bekor qilindi', booking: cancelled });
});

// ---------------------------------------------------------------------------
//  GET /api/owner/stats — owner statistikasi
// ---------------------------------------------------------------------------
const getOwnerStats = asyncHandler(async (req, res) => {
  const stats = await StatsModel.ownerStats(req.user.userId);
  res.json({ success: true, stats });
});

module.exports = { getOwnerVenues, updateOwnVenue, getOwnerBookings, cancelOwnerBooking, getOwnerStats };
