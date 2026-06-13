const multer = require('multer');
const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------------
//  memoryStorage — fayllar BUFFER sifatida (diskka emas).
//  Keyin config/imageStorage.js saveImage() ularni Cloudinary (production)
//  yoki lokal diskka (dev) yozadi.
// ---------------------------------------------------------------------------
const storage = multer.memoryStorage();

// Faqat rasm fayllariga ruxsat
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Faqat rasm fayllari (jpeg, png, webp, gif) ruxsat etiladi'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // har bir fayl maks 5MB
});

module.exports = upload;
