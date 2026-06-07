require('dotenv').config();

const app = require('./app');
const { connectDB, pool } = require('./config/db');
const { verifyEmailConfig } = require('./config/email');

const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
//  Serverni ishga tushirish: avval bazaga ulanamiz, so'ng tinglashni boshlaymiz
// ---------------------------------------------------------------------------
async function startServer() {
  try {
    await connectDB(); // baza ulanmasa, server ham ishlamasligi kerak
    verifyEmailConfig(); // SMTP ni tekshiramiz (xato bo'lsa ham server ishlaydi)

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT}-portda ishlamoqda (${process.env.NODE_ENV || 'development'})`);
    });

    // --- Toza yopilish (graceful shutdown) ---
    const shutdown = (signal) => {
      console.log(`\n${signal} qabul qilindi. Server yopilmoqda...`);

      // Fallback: ochiq (keep-alive) ulanishlar tufayli yopilish cho'zilsa,
      // belgilangan vaqtdan keyin majburan chiqamiz — process osilib qolmasin.
      const forceExit = setTimeout(() => {
        console.error('⏱️  Yopilish cho\'zildi — majburan to\'xtatilmoqda');
        process.exit(1);
      }, 10000);
      forceExit.unref();

      server.close(async () => {
        try {
          await pool.end(); // baza ulanishlarini yopamiz
          console.log('✅ Server va baza ulanishi yopildi');
        } catch (err) {
          console.error('Baza ulanishini yopishda xato:', err.message);
        } finally {
          clearTimeout(forceExit);
          process.exit(0);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Serverni ishga tushirib bo\'lmadi:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
//  Kutilmagan global xatolar (xavfsizlik to'ri).
//  Bunday xatodan keyin process nomuvofiq (undefined) holatda bo'lishi mumkin —
//  log qilamiz va chiqamiz. Process menejeri (PM2/Docker/systemd) qayta ishga
//  tushiradi. Loglashsiz davom etish xavfli hisoblanadi.
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('❌ Ushlanmagan Promise rad etishi:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Ushlanmagan istisno (uncaughtException):', err);
  process.exit(1);
});

startServer();
