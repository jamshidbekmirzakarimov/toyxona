const fs = require('fs').promises;

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const VenueModel = require('../models/venue.model');

// ---------------------------------------------------------------------------
//  Yordamchi funksiyalar
// ---------------------------------------------------------------------------

// Saqlangan fayldan URL (statik /uploads orqali ochiladi)
const toUrl = (file) => `/uploads/${file.filename}`;

// Bo'sh bo'lmagan string
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// Stringni songa aylantirish (bo'sh/null -> NaN)
const toNum = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

// req.files (object) ichidagi barcha fayllarning disk yo'llari (tozalash uchun)
const collectUploadedPaths = (files) =>
  files ? Object.values(files).flat().map((f) => f.path) : [];

// Xatoda yuklangan fayllarni o'chirish (orphan fayl qolmasligi uchun)
const cleanupFiles = async (paths) => {
  await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
};

// multipart/form-data ichidagi JSON string maydonni xavfsiz parse qilish
const parseJsonField = (value, fieldName, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value; // allaqachon parse qilingan
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(400, `${fieldName} maydoni noto'g'ri JSON formatda`);
  }
};

// ---------------------------------------------------------------------------
//  Validatsiya — barcha xatolarni yig'ib, bitta 400 javobda qaytaradi
// ---------------------------------------------------------------------------
const validateVenue = (d) => {
  const errors = [];

  if (!isNonEmpty(d.name)) errors.push('name majburiy');
  if (!isNonEmpty(d.district)) errors.push('district majburiy');
  if (!isNonEmpty(d.address)) errors.push('address majburiy');

  if (!isNonEmpty(d.phone)) {
    errors.push('phone majburiy');
  } else if (!/^\+?[0-9\s\-()]{7,20}$/.test(d.phone)) {
    errors.push("phone formati noto'g'ri");
  }

  const cap = toNum(d.capacity);
  if (!Number.isInteger(cap) || cap <= 0) {
    errors.push('capacity musbat butun son bo\'lishi kerak');
  }

  const pps = toNum(d.price_per_seat);
  if (Number.isNaN(pps) || pps <= 0) {
    errors.push('price_per_seat musbat son bo\'lishi kerak');
  }

  // singers
  if (!Array.isArray(d.singers)) {
    errors.push('singers massiv bo\'lishi kerak');
  } else {
    d.singers.forEach((s, i) => {
      if (!s || !isNonEmpty(s.name)) errors.push(`singers[${i}].name majburiy`);
      const p = toNum(s && s.price);
      if (Number.isNaN(p) || p < 0) errors.push(`singers[${i}].price manfiy bo'lmagan son bo'lishi kerak`);
    });
  }

  // cars
  if (!Array.isArray(d.cars)) {
    errors.push('cars massiv bo\'lishi kerak');
  } else {
    d.cars.forEach((c, i) => {
      if (!c || !isNonEmpty(c.brand)) errors.push(`cars[${i}].brand majburiy`);
      const p = toNum(c && c.price);
      if (Number.isNaN(p) || p < 0) errors.push(`cars[${i}].price manfiy bo'lmagan son bo'lishi kerak`);
    });
  }

  // menu_items
  if (!Array.isArray(d.menu_items)) {
    errors.push('menu_items massiv bo\'lishi kerak');
  } else {
    d.menu_items.forEach((m, i) => {
      if (!isNonEmpty(typeof m === 'string' ? m : '')) errors.push(`menu_items[${i}] bo'sh bo'lmasligi kerak`);
    });
  }

  // karnay_surnay (ixtiyoriy)
  if (d.karnay_surnay !== null && d.karnay_surnay !== undefined) {
    const k = d.karnay_surnay;
    if (typeof k !== 'object' || Array.isArray(k)) {
      errors.push('karnay_surnay obyekt bo\'lishi kerak');
    } else {
      if (typeof k.available !== 'boolean') errors.push('karnay_surnay.available boolean bo\'lishi kerak');
      const kp = toNum(k.price);
      if (Number.isNaN(kp) || kp < 0) errors.push('karnay_surnay.price manfiy bo\'lmagan son bo\'lishi kerak');
    }
  }

  if (errors.length) {
    throw new ApiError(400, 'Validatsiya xatosi: ' + errors.join('; '));
  }
};

// ---------------------------------------------------------------------------
//  POST /api/venues
//  multipart/form-data qabul qiladi. Admin -> 'tasdiqlangan',
//  owner -> 'tasdiqlanmagan'. Hammasi transaction bilan yoziladi.
//
//  Fayl maydonlari (Multer upload.fields):
//    images        — to'yxona suratlari (bir nechta)
//    singerImages  — honanda suratlari (singers tartibida)
//    carImages     — mashina suratlari (cars tartibida)
//
//  JSON-string maydonlar (form-data): singers, cars, menu_items, karnay_surnay
// ---------------------------------------------------------------------------
const createVenue = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const uploadedPaths = collectUploadedPaths(files);

  try {
    // --- Matn maydonlari ---
    const { name, district, address, phone, description, capacity, price_per_seat } = req.body;

    // --- JSON massivlar ---
    const singers = parseJsonField(req.body.singers, 'singers', []);
    const cars = parseJsonField(req.body.cars, 'cars', []);
    const menu_items = parseJsonField(req.body.menu_items, 'menu_items', []);
    const karnay_surnay = parseJsonField(req.body.karnay_surnay, 'karnay_surnay', null);

    // --- Validatsiya ---
    validateVenue({ name, district, address, phone, capacity, price_per_seat, singers, cars, menu_items, karnay_surnay });

    // --- Rasmlar (index bo'yicha bog'lanadi) ---
    const venueImages = (files.images || []).map(toUrl);
    const singerImages = files.singerImages || [];
    const carImages = files.carImages || [];

    // Rasm soni element sonidan ko'p bo'lib ketmasligini tekshiramiz (orphan oldini olish)
    if (singerImages.length > singers.length) {
      throw new ApiError(400, 'singerImages soni singers sonidan ko\'p');
    }
    if (carImages.length > cars.length) {
      throw new ApiError(400, 'carImages soni cars sonidan ko\'p');
    }

    const singersData = singers.map((s, i) => ({
      name: s.name.trim(),
      price: Number(s.price),
      image_url: singerImages[i] ? toUrl(singerImages[i]) : null,
    }));

    const carsData = cars.map((c, i) => ({
      brand: c.brand.trim(),
      price: Number(c.price),
      image_url: carImages[i] ? toUrl(carImages[i]) : null,
    }));

    const menuData = menu_items.map((m) => String(m).trim());

    // --- Status va owner (roldan kelib chiqib) ---
    const status = req.user.role === 'admin' ? 'tasdiqlangan' : 'tasdiqlanmagan';
    const owner_id = req.user.userId;

    // --- Transaction bilan yozish ---
    const venue = await VenueModel.createWithRelations({
      name: name.trim(),
      district: district.trim(),
      address: address.trim(),
      capacity: Number(capacity),
      price_per_seat: Number(price_per_seat),
      phone: phone.trim(),
      description: isNonEmpty(description) ? description.trim() : null,
      status,
      owner_id,
      images: venueImages,
      singers: singersData,
      cars: carsData,
      menu_items: menuData,
      karnay_surnay: karnay_surnay
        ? { available: Boolean(karnay_surnay.available), price: Number(karnay_surnay.price) || 0 }
        : null,
    });

    res.status(201).json({
      success: true,
      message: 'To\'yxona muvaffaqiyatli qo\'shildi',
      venue,
    });
  } catch (err) {
    // Har qanday xatoda (validatsiya yoki DB) yuklangan fayllarni o'chiramiz
    await cleanupFiles(uploadedPaths);
    throw err; // global error handler'ga uzatiladi
  }
});

// ---------------------------------------------------------------------------
//  GET /api/venues
//  Query: search, district, status (faqat admin), sortBy (price|capacity), order (asc|desc)
//
//  Ruxsat:
//   - oddiy foydalanuvchi / mehmon -> faqat status='tasdiqlangan';
//   - admin -> barchasini ko'radi va status bo'yicha filtrlashi mumkin.
// ---------------------------------------------------------------------------
const ALLOWED_SORT = ['price', 'capacity'];
const ALLOWED_ORDER = ['asc', 'desc'];
const ALLOWED_STATUS = ['tasdiqlangan', 'tasdiqlanmagan'];

const listVenues = asyncHandler(async (req, res) => {
  const { search, district, sortBy, status } = req.query;
  const order = req.query.order ? String(req.query.order).toLowerCase() : undefined;
  const isAdmin = req.user && req.user.role === 'admin';

  // --- sortBy / order validatsiyasi (berilgan bo'lsa) ---
  if (sortBy !== undefined && !ALLOWED_SORT.includes(sortBy)) {
    throw new ApiError(400, "sortBy faqat 'price' yoki 'capacity' bo'lishi mumkin");
  }
  if (order !== undefined && !ALLOWED_ORDER.includes(order)) {
    throw new ApiError(400, "order faqat 'asc' yoki 'desc' bo'lishi mumkin");
  }

  // --- status filtri: faqat admin uchun ---
  let effectiveStatus;
  if (isAdmin) {
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        throw new ApiError(400, "status faqat 'tasdiqlangan' yoki 'tasdiqlanmagan' bo'lishi mumkin");
      }
      effectiveStatus = status; // admin tanlagan status
    }
    // status berilmasa -> admin barchasini ko'radi (effectiveStatus = undefined)
  } else {
    // oddiy foydalanuvchi / mehmon: status param e'tiborga olinmaydi
    effectiveStatus = 'tasdiqlangan';
  }

  const venues = await VenueModel.findAll({
    search: isNonEmpty(search) ? search.trim() : undefined,
    district: isNonEmpty(district) ? district.trim() : undefined,
    status: effectiveStatus,
    sortBy,
    order,
  });

  res.json({
    success: true,
    count: venues.length,
    venues, // har birida thumbnail (birinchi surat URL yoki null)
  });
});

// ---------------------------------------------------------------------------
//  Yordamchilar (yakka to'yxona / kalendar uchun)
// ---------------------------------------------------------------------------

// Tasdiqlanmagan to'yxonani ko'rish huquqi — faqat admin yoki egasi
const canSeeUnapproved = (user, venue) =>
  !!user && (user.role === 'admin' || user.userId === venue.owner_id);

// Date -> 'YYYY-MM-DD' (mahalliy sana, vaqt zonasi siljishisiz)
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Kelgusi 12 oy uchun kalendar (joriy oy 1-kunidan boshlab)
const buildCalendar = (bookedDates) => {
  const days = [];
  const now = new Date();
  const todayStr = toDateStr(now);
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1); // joriy oy boshi
  const end = new Date(now.getFullYear(), now.getMonth() + 12, 1); // 12 oydan keyin

  while (cursor < end) {
    const dateStr = toDateStr(cursor);
    let status;
    if (dateStr < todayStr) status = 'past'; // o'tib ketgan
    else if (bookedDates.has(dateStr)) status = 'booked'; // band
    else status = 'free'; // bo'sh
    days.push({ date: dateStr, status });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// id ni tekshirib, son sifatida qaytaradi
const parseVenueId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Noto\'g\'ri to\'yxona id');
  }
  return id;
};

// ---------------------------------------------------------------------------
//  GET /api/venues/:id
//  Yakka to'yxonaning to'liq ma'lumoti: suratlar, honandalar, mashinalar,
//  menyu, karnay-surnay, narx, egasi va bronlar.
// ---------------------------------------------------------------------------
const getVenue = asyncHandler(async (req, res) => {
  const id = parseVenueId(req.params.id);

  const venue = await VenueModel.findDetailById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');

  // Tasdiqlanmagan to'yxona faqat admin yoki egasiga ko'rinadi
  if (venue.status !== 'tasdiqlangan' && !canSeeUnapproved(req.user, venue)) {
    throw new ApiError(404, 'To\'yxona topilmadi');
  }

  res.json({ success: true, venue });
});

// ---------------------------------------------------------------------------
//  GET /api/venues/:id/calendar
//  Kelgusi 12 oy uchun har bir sana holati: 'free' | 'booked' | 'past'.
// ---------------------------------------------------------------------------
const getVenueCalendar = asyncHandler(async (req, res) => {
  const id = parseVenueId(req.params.id);

  const venue = await VenueModel.findById(id);
  if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');
  if (venue.status !== 'tasdiqlangan' && !canSeeUnapproved(req.user, venue)) {
    throw new ApiError(404, 'To\'yxona topilmadi');
  }

  const bookedDates = new Set(await VenueModel.findBookedDates(id));
  const calendar = buildCalendar(bookedDates);

  res.json({
    success: true,
    venueId: id,
    months: 12,
    calendar, // [{ date: 'YYYY-MM-DD', status: 'free'|'booked'|'past' }, ...]
  });
});

module.exports = { createVenue, listVenues, getVenue, getVenueCalendar, validateVenue };
