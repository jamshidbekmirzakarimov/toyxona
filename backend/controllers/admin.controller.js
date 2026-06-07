const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/user.model');
const VenueModel = require('../models/venue.model');
const BookingModel = require('../models/booking.model');
const { validateVenue } = require('./venue.controller');

// uploads/ papkasi (fayllarni o'chirish uchun)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

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

const isValidDateStr = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

const ALLOWED_BOOKING_SORT = ['date', 'venue', 'district', 'status', 'total', 'created'];
const ALLOWED_ORDER = ['asc', 'desc'];
const ALLOWED_BOOKING_STATUS = ['endi bo\'ladigan', 'bo\'lib o\'tgan', 'bekor qilingan'];

// ---------------------------------------------------------------------------
//  POST /api/admin/owners — yangi to'yxona egasi yaratish
// ---------------------------------------------------------------------------
const createOwner = asyncHandler(async (req, res) => {
  const { name, surname, email, username, password } = req.body;

  const errors = [];
  if (!isNonEmpty(name)) errors.push('name majburiy');
  if (!isNonEmpty(surname)) errors.push('surname majburiy');
  if (!isNonEmpty(email)) errors.push('email majburiy');
  if (!isNonEmpty(username)) errors.push('username majburiy');
  if (!isNonEmpty(password) || password.length < 6) errors.push('password kamida 6 ta belgi bo\'lishi kerak');
  if (errors.length) {
    throw new ApiError(400, 'Validatsiya xatosi: ' + errors.join('; '));
  }

  if (await UserModel.findByEmail(email)) {
    throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  }
  if (await UserModel.findByUsername(username)) {
    throw new ApiError(409, 'Bu username band');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const owner = await UserModel.create({
    name,
    surname,
    email,
    username,
    password: hashedPassword,
    role: 'owner',
  });

  res.status(201).json({
    success: true,
    message: 'To\'yxona egasi yaratildi',
    owner, // parolsiz
  });
});

// ---------------------------------------------------------------------------
//  GET /api/admin/owners — barcha egalar
// ---------------------------------------------------------------------------
const listOwners = asyncHandler(async (req, res) => {
  const owners = await UserModel.findOwners();
  res.json({ success: true, count: owners.length, owners });
});

// ---------------------------------------------------------------------------
//  PUT /api/admin/venues/:id/assign — to'yxonaga egani biriktirish
// ---------------------------------------------------------------------------
const assignVenueOwner = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'to\'yxona id');

  const ownerId = Number(req.body.owner_id);
  if (!Number.isInteger(ownerId) || ownerId <= 0) {
    throw new ApiError(400, 'owner_id majburiy va musbat son bo\'lishi kerak');
  }

  const venue = await VenueModel.findById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');

  const owner = await UserModel.findById(ownerId);
  if (!owner) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (owner.role !== 'owner') {
    throw new ApiError(400, 'Belgilangan foydalanuvchi owner emas');
  }

  const updated = await VenueModel.assignOwner(id, ownerId);
  res.json({ success: true, message: 'Egasi biriktirildi', venue: updated });
});

// ---------------------------------------------------------------------------
//  PUT /api/admin/venues/:id/approve — to'yxonani tasdiqlash
// ---------------------------------------------------------------------------
const approveVenue = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'to\'yxona id');

  const venue = await VenueModel.findById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');

  const updated = await VenueModel.updateStatus(id, 'tasdiqlangan');
  res.json({ success: true, message: 'To\'yxona tasdiqlandi', venue: updated });
});

// ---------------------------------------------------------------------------
//  DELETE /api/admin/venues/:id — to'yxonani o'chirish (+ disk fayllar)
// ---------------------------------------------------------------------------
const deleteVenue = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'to\'yxona id');

  const venue = await VenueModel.findById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');

  // O'chirishdan oldin rasm URL larini olamiz
  const imageUrls = await VenueModel.getImagePaths(id);

  // DB dan o'chiramiz (CASCADE bog'liq jadvallarni ham o'chiradi)
  await VenueModel.delete(id);

  // Disk fayllarini tozalaymiz (best-effort)
  await Promise.all(
    imageUrls.map((url) => fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {}))
  );

  res.json({ success: true, message: 'To\'yxona o\'chirildi' });
});

// ---------------------------------------------------------------------------
//  PUT /api/admin/venues/:id — to'yxona + xizmatlarni tahrirlash
//  body (JSON): name, district, address, capacity, price_per_seat, phone,
//               description, singers[], cars[], menu_items[], karnay_surnay
// ---------------------------------------------------------------------------
const editVenue = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'to\'yxona id');

  const venue = await VenueModel.findById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');

  const { name, district, address, phone, description, capacity, price_per_seat } = req.body;
  const singers = Array.isArray(req.body.singers) ? req.body.singers : [];
  const cars = Array.isArray(req.body.cars) ? req.body.cars : [];
  const menu_items = Array.isArray(req.body.menu_items) ? req.body.menu_items : [];
  const karnay_surnay = req.body.karnay_surnay != null ? req.body.karnay_surnay : null;

  // venue.controller dan qayta ishlatilgan validatsiya
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
//  GET /api/admin/bookings — barcha bronlar (filtr/sort)
//  query: date, venue_id, district, status, sortBy (date|total|created), order (asc|desc)
// ---------------------------------------------------------------------------
const listAllBookings = asyncHandler(async (req, res) => {
  const { district, status, sortBy, date, venue_id } = req.query;
  const order = req.query.order ? String(req.query.order).toLowerCase() : undefined;

  // Validatsiya (berilgan bo'lsa)
  if (date !== undefined && !isValidDateStr(date)) {
    throw new ApiError(400, 'date YYYY-MM-DD formatda bo\'lishi kerak');
  }
  let venueId;
  if (venue_id !== undefined) {
    venueId = Number(venue_id);
    if (!Number.isInteger(venueId) || venueId <= 0) {
      throw new ApiError(400, 'venue_id musbat son bo\'lishi kerak');
    }
  }
  if (status !== undefined && !ALLOWED_BOOKING_STATUS.includes(status)) {
    throw new ApiError(400, 'status noto\'g\'ri (endi bo\'ladigan | bo\'lib o\'tgan | bekor qilingan)');
  }
  if (sortBy !== undefined && !ALLOWED_BOOKING_SORT.includes(sortBy)) {
    throw new ApiError(400, 'sortBy faqat date | total | created bo\'lishi mumkin');
  }
  if (order !== undefined && !ALLOWED_ORDER.includes(order)) {
    throw new ApiError(400, 'order faqat asc | desc bo\'lishi mumkin');
  }

  const bookings = await BookingModel.findAll({
    date: date || undefined,
    venueId,
    district: isNonEmpty(district) ? district.trim() : undefined,
    status,
    sortBy,
    order,
  });

  res.json({ success: true, count: bookings.length, bookings });
});

// ---------------------------------------------------------------------------
//  DELETE /api/admin/bookings/:id — istalgan bronni bekor qilish
// ---------------------------------------------------------------------------
const cancelAnyBooking = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'bron id');

  const booking = await BookingModel.findById(id);
  if (!booking) throw new ApiError(404, 'Bron topilmadi');

  if (booking.status === 'bekor qilingan') {
    throw new ApiError(400, 'Bron allaqachon bekor qilingan');
  }
  if (booking.status === 'bo\'lib o\'tgan') {
    throw new ApiError(400, 'O\'tib ketgan bronni bekor qilib bo\'lmaydi');
  }

  const cancelled = await BookingModel.cancel(id);
  res.json({ success: true, message: 'Bron bekor qilindi', booking: cancelled });
});

module.exports = {
  createOwner,
  listOwners,
  assignVenueOwner,
  approveVenue,
  deleteVenue,
  editVenue,
  listAllBookings,
  cancelAnyBooking,
};
