const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');

const app = express();

// ---------------------------------------------------------------------------
//  Global middleware'lar
// ---------------------------------------------------------------------------

// Xavfsizlik header'lari (X-Frame-Options, X-Content-Type-Options va h.k.).
// X-Powered-By header'ini ham o'chiradi (server texnologiyasini yashiradi).
app.use(helmet());

// CORS — bir nechta origin'ga ruxsat (lokal dev + deploy qilingan frontend).
// Qo'shimcha origin'larni CLIENT_URL env orqali (vergul bilan ajratib) qo'shish mumkin.
const defaultOrigins = [
  'http://localhost:5173',
  'https://toyxona-gules.vercel.app',
];
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')) // bo'sh joy va oxirgi '/' ni olib tashlash
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      // origin yo'q (curl, Swagger, server-to-server) yoki ruxsat etilgan ro'yxatda bo'lsa — ruxsat
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // aks holda CORS sarlavhalari qo'shilmaydi (brauzer bloklaydi), 500 ham bermaydi
      return callback(null, false);
    },
    credentials: true,
  })
);

// JSON va form-data (urlencoded) body'larni o'qish
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP so'rovlar logi: development'da o'qishga qulay 'dev', production'da 'combined'
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---------------------------------------------------------------------------
//  Statik fayllar — yuklangan suratlar (uploads/) ochiq qilinadi.
//  Misol: http://localhost:5000/uploads/venue-123.jpg
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
//  Health check
// ---------------------------------------------------------------------------
// Ildiz (root) — Render health-check va brauzer uchun (404 bo'lmasligi uchun)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "To'yxona API ishlamoqda 🎉",
    docs: '/api/docs',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'To\'yxona API ishlamoqda' });
});

// ---------------------------------------------------------------------------
//  Swagger API hujjati: /api/docs (interaktiv), /api/docs.json (xom spec)
// ---------------------------------------------------------------------------
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: "To'yxona API Docs" })
);

// ---------------------------------------------------------------------------
//  Route'lar
// ---------------------------------------------------------------------------
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/venues', require('./routes/venue.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/owner', require('./routes/owner.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ---------------------------------------------------------------------------
//  Xato boshqaruvi (HAR DOIM eng oxirida — barcha route'lardan keyin)
// ---------------------------------------------------------------------------
app.use(notFound); // mos route topilmasa
app.use(errorHandler); // global xato handler

module.exports = app;
