# 🎉 To'yxona Online Bron Tizimi

To'yxonalarni online ko'rish va bron qilish uchun **fullstack** web ilova. Foydalanuvchilar to'yxonalarni qidiradi, bo'sh kunlarni kalendardan tanlaydi va xizmatlar (honanda, mashina, karnay-surnay) bilan birga bron qiladi. Egalar o'z to'yxonalarini boshqaradi, admin esa butun tizimni nazorat qiladi.

**Stek:** PostgreSQL · Node.js (Express) · React (Vite) · JWT autentifikatsiya

---

## 📋 Mundarija

- [Imkoniyatlar](#-imkoniyatlar-rollar-boyicha)
- [Texnologiyalar](#-texnologiyalar)
- [Loyiha strukturasi](#-loyiha-strukturasi)
- [Talablar](#-talablar)
- [O'rnatish](#-ornatish)
- [.env sozlash](#-env-sozlash)
- [Ma'lumotlar bazasi (migration)](#-malumotlar-bazasi-migration)
- [Ishga tushirish](#-ishga-tushirish)
- [API qisqacha](#-api-qisqacha)
- [Litsenziya](#-litsenziya)

---

## 🚀 Imkoniyatlar (rollar bo'yicha)

Tizimda **3 rol** mavjud: `admin`, `owner` (to'yxona egasi), `user` (oddiy foydalanuvchi).

### 👤 User (oddiy foydalanuvchi)
- Ro'yxatdan o'tish va kirish (JWT)
- Tasdiqlangan to'yxonalarni ko'rish — **qidiruv** (nom), **filtr** (rayon), **saralash** (narx/sig'im)
- To'yxona to'liq sahifasi: surat galereyasi, honandalar, mashinalar, menyu, karnay-surnay
- **Bron kalendari** (12 oy): bo'sh / band / o'tgan kunlar
- Bo'sh kunni tanlab **bron qilish** — xizmatlarni tanlash, umumiy narx va **20% avans** realtime hisoblanadi
- "Mening bronlarim" — bronlarni ko'rish va **bekor qilish**

### 🏛 Owner (to'yxona egasi)
- Birinchi marta kirishda **email OTP** orqali tasdiqlash (6 xonali kod, 5 daqiqa amal qiladi)
- O'z to'yxonasini **ro'yxatdan o'tkazish** (rasm yuklash, dinamik honanda/mashina/menyu, karnay-surnay)
- To'yxona admin tomonidan tasdiqlanmaguncha `tasdiqlanmagan` holatda turadi
- O'z to'yxonalarini **tahrirlash**
- O'z to'yxonalaridagi **bronlarni** ko'rish va bekor qilish
- ⚠️ Faqat **o'ziga tegishli** resurslarga kira oladi (ownership tekshiruvi)

### 🛡 Admin
- Yangi **to'yxona egasi yaratish** va egalar ro'yxatini ko'rish
- Barcha to'yxonalar: filtr (rayon/status), saralash (narx/sig'im)
- Har bir to'yxona uchun: **tasdiqlash**, **egani biriktirish**, **tahrirlash**, **o'chirish**
- Yangi to'yxona qo'shish (avtomatik `tasdiqlangan`)
- Barcha **bronlar**: sana/to'yxona/rayon/status bo'yicha saralash, bekor qilish

---

## 🛠 Texnologiyalar

### Backend
| Texnologiya | Maqsad |
|-------------|--------|
| Node.js + Express | REST API server |
| PostgreSQL (`pg`) | Ma'lumotlar bazasi (connection pool) |
| `jsonwebtoken` | JWT autentifikatsiya |
| `bcryptjs` | Parol hashlash |
| `multer` | Rasm yuklash (multipart/form-data) |
| `nodemailer` | Email OTP yuborish |
| `express-validator` | Kirish ma'lumotlari validatsiyasi |
| `helmet`, `cors`, `morgan` | Xavfsizlik, CORS, loglash |
| `dotenv`, `nodemon` (dev) | Konfiguratsiya, dev server |

### Frontend
| Texnologiya | Maqsad |
|-------------|--------|
| React 18 + Vite | UI va dev/build tool |
| `react-router-dom` | Routing |
| `axios` | HTTP klient (interceptorlar bilan) |
| `zustand` | Holat boshqaruvi (auth, toast) |
| Oddiy CSS | Responsive dizayn (tashqi UI kutubxonasiz) |

---

## 📁 Loyiha strukturasi

```
Toyxona Loyihasi/
├── backend/
│   ├── index.js              # Kirish nuqtasi (server start)
│   ├── app.js                # Express ilova (middleware, route'lar)
│   ├── config/               # db.js (pg Pool), email.js (nodemailer)
│   ├── routes/               # auth, venue, booking, owner, admin route'lari
│   ├── controllers/          # so'rov mantig'i
│   ├── models/               # SQL so'rovlari (user, venue, booking, otp)
│   ├── middleware/           # auth, role, optionalAuth, upload, validate, errorHandler
│   ├── validators/           # express-validator zanjirlari
│   ├── utils/                # asyncHandler, ApiError, generateToken, generateOtp
│   ├── uploads/              # yuklangan rasmlar (gitignore)
│   └── migrations/           # 001_init_schema.sql
│
└── frontend/
    └── src/
        ├── main.jsx          # BrowserRouter + App
        ├── App.jsx           # route'lar
        ├── index.css         # global uslublar
        ├── pages/            # HomePage, VenueDetailPage, auth, owner/, admin/
        ├── components/       # Navbar, Layout, VenueForm, Calendar, Spinner, ...
        ├── store/            # authStore, toastStore (Zustand)
        └── utils/            # api, validators, districts, roles, venuePayload
```

---

## ✅ Talablar

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 13
- **npm** (Node bilan birga keladi)
- Email OTP uchun: SMTP hisob (masalan Gmail **App Password**)

---

## 📦 O'rnatish

Repozitoriyani klonlang (yoki papkaga o'ting), so'ng backend va frontend'ni **alohida** o'rnating.

### 1. Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env   # so'ng .env ni to'ldiring (pastga qarang)
```

### 2. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env   # VITE_API_URL ni tekshiring
```

---

## 🔐 .env sozlash

### `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=toyxona_db

# JWT
JWT_SECRET=kuchli_maxfiy_kalit_almashtiring
JWT_EXPIRES_IN=7d

# Email (Nodemailer) — owner OTP uchun
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM="To'yxona Bron Tizimi <your_email@gmail.com>"

# Frontend manzili (CORS)
CLIENT_URL=http://localhost:5173
```

> **Eslatma:** Gmail uchun oddiy parol emas, **App Password** kerak (2FA yoqilgan bo'lishi shart). Port `587` → STARTTLS, `465` → SSL.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

> Bo'sh qoldirilsa, Vite proxy orqali `/api` va `/uploads` backendga yo'naltiriladi (dev rejimida CORS muammosiz).

---

## 🗄 Ma'lumotlar bazasi (migration)

Bazani yarating va sxemani qo'llang:

```powershell
# 1) Bazani yaratish
psql -U postgres -c "CREATE DATABASE toyxona_db;"

# 2) Migration (jadvallar, ENUM tiplar, indekslar)
psql -U postgres -d toyxona_db -f backend/migrations/001_init_schema.sql
```

Yaratiladigan asosiy jadvallar: `users`, `venues`, `venue_images`, `singers`, `cars`,
`menu_items`, `karnay_surnay`, `bookings`, `booking_services`, `otp_codes`.

---

## ▶️ Ishga tushirish

Ikki terminal kerak (backend va frontend alohida).

```powershell
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev      # nodemon bilan; yoki: npm start

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

**Tekshirish:**
- Backend sog'ligi: `http://localhost:5000/api/health` → `{ "success": true, ... }`
- Frontend: brauzerda `http://localhost:5173`

**Frontend build (production):**
```powershell
cd frontend
npm run build    # natija: dist/
npm run preview  # build'ni lokal ko'rish
```

---

## 🌐 API qisqacha

Barcha endpointlar `/api` prefiksi bilan. Himoyalangan endpointlar `Authorization: Bearer <token>` talab qiladi.

| Metod | Endpoint | Ruxsat | Tavsif |
|-------|----------|--------|--------|
| POST | `/auth/register` | ommaviy | Ro'yxatdan o'tish |
| POST | `/auth/login` | ommaviy | Kirish (yoki owner uchun OTP) |
| POST | `/auth/verify-otp` | ommaviy | Owner email OTP tasdiqlash |
| GET | `/venues` | ommaviy | Ro'yxat (qidiruv/filtr/sort) |
| GET | `/venues/:id` | ommaviy | To'liq ma'lumot + bronlar |
| GET | `/venues/:id/calendar` | ommaviy | 12 oylik bron kalendari |
| POST | `/venues` | admin/owner | Yangi to'yxona (rasm bilan) |
| POST | `/bookings` | user | Bron yaratish |
| GET | `/bookings/my` | user | O'z bronlari |
| DELETE | `/bookings/:id` | egasi/owner/admin | Bronni bekor qilish |
| GET/POST/PUT/DELETE | `/owner/*` | owner | O'z to'yxona va bronlari |
| GET/POST/PUT/DELETE | `/admin/*` | admin | Egalar, to'yxonalar, bronlar |

---

## 📄 Litsenziya

MIT

---

> Kod uslubi va konvensiyalar uchun [CODING_STANDARDS.md](CODING_STANDARDS.md) ga qarang.
# toyxona
