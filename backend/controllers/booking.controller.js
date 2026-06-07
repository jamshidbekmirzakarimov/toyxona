const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const BookingModel = require('../models/booking.model');
const VenueModel = require('../models/venue.model');

// Avans foizi
const ADVANCE_PERCENT = 20;

// ---------------------------------------------------------------------------
//  Yordamchilar
// ---------------------------------------------------------------------------
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// Pulni 2 kasrgacha yaxlitlash
const round2 = (n) => Math.round(n * 100) / 100;

// Date -> 'YYYY-MM-DD' (mahalliy sana)
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 'YYYY-MM-DD' formatdagi haqiqiy sana ekanini tekshirish
const isValidDateStr = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

// Bron id ni tekshirish
const parseId = (raw, label) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Noto'g'ri ${label}`);
  }
  return id;
};

// ---------------------------------------------------------------------------
//  POST /api/bookings
//  body: venue_id, booking_date, guest_count, selected_services {singers, cars},
//        karnay_surnay (boolean), customer_name, customer_surname, customer_phone
// ---------------------------------------------------------------------------
const createBooking = asyncHandler(async (req, res) => {
  const {
    venue_id,
    booking_date,
    guest_count,
    selected_services,
    customer_name,
    customer_surname,
    customer_phone,
  } = req.body;
  const karnaySelected = Boolean(req.body.karnay_surnay);

  // --- Asosiy validatsiya ---
  const errors = [];
  const vId = Number(venue_id);
  if (!Number.isInteger(vId) || vId <= 0) errors.push('venue_id majburiy');
  if (!isValidDateStr(booking_date)) errors.push('booking_date YYYY-MM-DD formatda bo\'lishi kerak');
  const guests = Number(guest_count);
  if (!Number.isInteger(guests) || guests <= 0) errors.push('guest_count musbat butun son bo\'lishi kerak');
  if (!isNonEmpty(customer_name)) errors.push('customer_name majburiy');
  if (!isNonEmpty(customer_surname)) errors.push('customer_surname majburiy');
  if (!isNonEmpty(customer_phone)) errors.push('customer_phone majburiy');
  else if (!/^\+?[0-9\s\-()]{7,20}$/.test(customer_phone)) errors.push('customer_phone formati noto\'g\'ri');
  if (errors.length) {
    throw new ApiError(400, 'Validatsiya xatosi: ' + errors.join('; '));
  }

  // --- To'yxona ---
  const venue = await VenueModel.findById(vId);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');
  if (venue.status !== 'tasdiqlangan') {
    throw new ApiError(400, 'Bu to\'yxona hali tasdiqlanmagan, bron qilib bo\'lmaydi');
  }

  // --- Sig'im ---
  if (guests > venue.capacity) {
    throw new ApiError(400, `Mehmonlar soni to'yxona sig'imidan (${venue.capacity}) oshmasligi kerak`);
  }

  // --- Sana o'tib ketmaganmi ---
  if (booking_date < toDateStr(new Date())) {
    throw new ApiError(400, 'O\'tib ketgan sanaga bron qilib bo\'lmaydi');
  }

  // --- Sana band emasmi (oldindan tekshirish; DB unique index — race himoyasi) ---
  const existing = await BookingModel.findActiveByVenueAndDate(vId, booking_date);
  if (existing) {
    throw new ApiError(409, 'Bu sana allaqachon band');
  }

  // --- Tanlangan xizmatlar (singers / cars) ---
  const sel = selected_services || {};
  const singerIds = Array.isArray(sel.singers) ? sel.singers.map(Number) : [];
  const carIds = Array.isArray(sel.cars) ? sel.cars.map(Number) : [];

  if (singerIds.some((x) => !Number.isInteger(x) || x <= 0)) {
    throw new ApiError(400, 'selected_services.singers faqat musbat id lardan iborat bo\'lishi kerak');
  }
  if (carIds.some((x) => !Number.isInteger(x) || x <= 0)) {
    throw new ApiError(400, 'selected_services.cars faqat musbat id lardan iborat bo\'lishi kerak');
  }

  const services = [];
  let servicesTotal = 0;

  if (singerIds.length) {
    const singers = await VenueModel.getSingersByIds(vId, singerIds);
    if (singers.length !== new Set(singerIds).size) {
      throw new ApiError(400, 'Tanlangan honanda(lar) bu to\'yxonaga tegishli emas');
    }
    for (const s of singers) {
      services.push({ kind: 'singer', id: s.id, price: Number(s.price) });
      servicesTotal += Number(s.price);
    }
  }

  if (carIds.length) {
    const cars = await VenueModel.getCarsByIds(vId, carIds);
    if (cars.length !== new Set(carIds).size) {
      throw new ApiError(400, 'Tanlangan mashina(lar) bu to\'yxonaga tegishli emas');
    }
    for (const c of cars) {
      services.push({ kind: 'car', id: c.id, price: Number(c.price) });
      servicesTotal += Number(c.price);
    }
  }

  // --- Karnay-surnay (ixtiyoriy) ---
  let karnayPrice = 0;
  if (karnaySelected) {
    const karnay = await VenueModel.getKarnay(vId);
    if (!karnay || !karnay.available) {
      throw new ApiError(400, 'Bu to\'yxonada karnay-surnay xizmati mavjud emas');
    }
    karnayPrice = Number(karnay.price);
  }

  // --- Narx hisoblash ---
  const seatTotal = Number(venue.price_per_seat) * guests;
  const total_price = round2(seatTotal + servicesTotal + karnayPrice);
  const advance_paid = round2((total_price * ADVANCE_PERCENT) / 100);

  // --- Yozish (transaction) ---
  const booking = await BookingModel.create({
    venue_id: vId,
    user_id: req.user.userId,
    booking_date,
    guest_count: guests,
    total_price,
    advance_paid,
    customer_name: customer_name.trim(),
    customer_surname: customer_surname.trim(),
    customer_phone: customer_phone.trim(),
    services,
  });

  res.status(201).json({
    success: true,
    message: 'Bron muvaffaqiyatli qabul qilindi',
    booking,
    // To'lov haqiqiy emas — frontend toast uchun avans summasi
    payment: {
      total_price,
      advance_paid,
      advance_percent: ADVANCE_PERCENT,
      note: 'To\'lov haqiqiy emas. Ko\'rsatilgan avans summasini to\'lashingiz kerak.',
    },
  });
});

// ---------------------------------------------------------------------------
//  DELETE /api/bookings/:id
//  Bronni bekor qilish — faqat to'yxona egasi, bron qilgan user yoki admin.
// ---------------------------------------------------------------------------
const cancelBooking = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'bron id');

  const booking = await BookingModel.findById(id);
  if (!booking) throw new ApiError(404, 'Bron topilmadi');

  const venue = await VenueModel.findById(booking.venue_id);
  const isBooker = req.user.userId === booking.user_id;
  const isOwner = venue && req.user.userId === venue.owner_id;
  const isAdmin = req.user.role === 'admin';

  if (!isBooker && !isOwner && !isAdmin) {
    throw new ApiError(403, 'Bu bronni bekor qilishga ruxsatingiz yo\'q');
  }

  if (booking.status === 'bekor qilingan') {
    throw new ApiError(400, 'Bron allaqachon bekor qilingan');
  }
  if (booking.status === 'bo\'lib o\'tgan') {
    throw new ApiError(400, 'O\'tib ketgan bronni bekor qilib bo\'lmaydi');
  }

  const cancelled = await BookingModel.cancel(id);

  res.json({
    success: true,
    message: 'Bron bekor qilindi',
    booking: cancelled,
  });
});

// ---------------------------------------------------------------------------
//  GET /api/bookings/my — joriy foydalanuvchining bronlari
// ---------------------------------------------------------------------------
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingModel.findByUserId(req.user.userId);
  res.json({ success: true, count: bookings.length, bookings });
});

module.exports = { createBooking, cancelBooking, getMyBookings };
