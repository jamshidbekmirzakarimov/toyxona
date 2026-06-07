const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------------
//  notFound — mavjud bo'lmagan route uchun 404 (route'lardan keyin qo'yiladi)
// ---------------------------------------------------------------------------
const notFound = (req, res, next) => {
  next(new ApiError(404, `Topilmadi - ${req.method} ${req.originalUrl}`));
};

// ---------------------------------------------------------------------------
//  errorHandler — global (markazlashgan) xato handler.
//  Express xato middleware'i 4 ta argument oladi: (err, req, res, next).
//  Barcha xatolar (asyncHandler orqali kelganlari ham) shu yerda yakunlanadi.
// ---------------------------------------------------------------------------
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi';

  // --- PostgreSQL xatolarini chiroyli xabarga aylantirish ---
  // 23505 = unique_violation (takrorlangan email/username yoki band sana)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Bu ma\'lumot allaqachon mavjud (takrorlanish)';
  }
  // 23503 = foreign_key_violation (mavjud bo'lmagan bog'liq yozuv)
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Bog\'liq ma\'lumot topilmadi';
  }
  // 23514 = check_violation (CHECK shartiga zid qiymat)
  if (err.code === '23514') {
    statusCode = 400;
    message = 'Yuborilgan qiymat shartlarga mos kelmadi';
  }

  // --- Multer (fayl yuklash) xatolari ---
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Fayl hajmi juda katta (har bir rasm maksimum 5MB)';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Kutilmagan fayl maydoni: ${err.field}`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Fayllar soni ruxsat etilganidan ko\'p';
    } else {
      message = 'Fayl yuklashda xato: ' + err.message;
    }
  }

  // Konsolga log (request konteksti bilan; stack faqat development'da)
  console.error(`[XATO] ${statusCode} - ${req.method} ${req.originalUrl} - ${err.message}`);
  if (!isProd) {
    console.error(err.stack);
  }

  // Production'da kutilmagan (operatsion bo'lmagan) 500 xatolarning ichki matni
  // mijozga fosh bo'lmasligi uchun umumiy xabar beramiz. Operatsion xatolar
  // (ApiError yoki statusCode < 500) esa o'z xabarini saqlaydi.
  const safeMessage =
    !isProd || err.isOperational || statusCode < 500 ? message : 'Server xatosi';

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    // stack faqat development rejimida ko'rsatiladi
    ...(!isProd && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
