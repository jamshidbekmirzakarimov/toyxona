const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// uploads/ papkasining absolyut yo'li
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// ---------------------------------------------------------------------------
//  Disk storage — fayllar uploads/ ga noyob nom bilan saqlanadi.
//  Nom: <maydon>-<vaqt>-<tasodif>.<kengaytma>  (to'qnashuvlarni oldini oladi)
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

// ---------------------------------------------------------------------------
//  fileFilter — faqat rasm fayllarini qabul qiladi
// ---------------------------------------------------------------------------
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Faqat rasm fayllari (jpeg, png, webp, gif) ruxsat etiladi'));
  }
};

// ---------------------------------------------------------------------------
//  Multer instance — har bir fayl uchun maks 5MB
// ---------------------------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
