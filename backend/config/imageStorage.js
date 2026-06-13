const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
//  Rasm saqlash — lokal disk (backend/uploads).
//  file — multer (memoryStorage) obyekti: { buffer, originalname, fieldname }
//  Qaytaradi: '/uploads/<fayl>' URL.
//
//  Eslatma: bulutli host (Render) diski vaqtinchalik — u yerda rasmlar
//  restart/deploy'da o'chadi. Doimiy saqlash kerak bo'lsa, keyinchalik
//  bulut storage (S3/Cloudflare/Cloudinary) qo'shsa bo'ladi.
// ---------------------------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

async function saveImage(file) {
  const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
  const filename = `${file.fieldname}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { saveImage };
