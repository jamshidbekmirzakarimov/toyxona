# 📐 Kod Standartlari — To'yxona Bron Tizimi

Ushbu hujjat loyihada qo'llaniladigan nomlash qoidalari, papka strukturasi, kommentariya
uslubi va kod formatlash sozlamalarini belgilaydi. Maqsad — kod **izchil, o'qiladigan va
qo'llab-quvvatlash oson** bo'lishi.

---

## 1. Umumiy printsiplar

- **Bir vazifa — bir modul.** Har bir fayl bitta aniq mas'uliyatga ega bo'lsin.
- **Qatlamlar ajratilgan:** `routes` → `controllers` → `models`. SQL faqat `models` ichida,
  biznes-mantiq `controllers` ichida, ulanish `routes` ichida.
- **`async/await`** ishlatiladi (callback yoki `.then()` zanjirlari emas, faqat zarur joyda).
- **Takrorlanmaslik (DRY):** umumiy mantiq qayta ishlatiladigan util/komponentga ajratiladi
  (masalan `VenueForm`, `asyncHandler`, `buildVenueFormData`).

---

## 2. Nomlash qoidalari

### 2.1 JavaScript identifikatorlari

| Element | Uslub | Misol |
|---------|-------|-------|
| O'zgaruvchi / funksiya | `camelCase` | `bookingDate`, `getOwnerVenues` |
| React komponenti | `PascalCase` | `VenueForm`, `ProtectedRoute` |
| React hook (custom) | `use` + `camelCase` | `useAuthStore` |
| Konstanta (global, o'zgarmas) | `UPPER_SNAKE_CASE` | `ADVANCE_PERCENT`, `TASHKENT_DISTRICTS` |
| Klass | `PascalCase` | `ApiError` |
| Boolean | `is/has/can` prefiksi | `isEdit`, `isVerified`, `canSeeBookingInfo` |

### 2.2 Fayl nomlari

| Tur | Uslub | Misol |
|-----|-------|-------|
| Backend modul | `kebab.role.js` (vazifa suffiksi bilan) | `auth.controller.js`, `user.model.js`, `venue.routes.js`, `booking.validator.js` |
| Frontend komponent/sahifa | `PascalCase.jsx` | `Navbar.jsx`, `VenueDetailPage.jsx` |
| Frontend util/store | `camelCase.js` | `api.js`, `authStore.js`, `venuePayload.js` |
| SQL migration | `NNN_tavsif.sql` | `001_init_schema.sql` |

### 2.3 Ma'lumotlar bazasi va API

- **DB ustunlari va jadvallari:** `snake_case` (`price_per_seat`, `booking_date`, `venue_images`).
- **API JSON maydonlari:** bazadan kelganlari `snake_case` saqlanadi (`total_price`, `guest_count`).
- **API javob qobig'i** izchil: har doim `success` bayrog'i + nomli payload (umumiy `data` emas,
  balki resursga mos nom):
  ```json
  { "success": true, "venue": { ... } }
  { "success": true, "count": 5, "venues": [ ... ] }
  ```
  Xatoda (global error handler): `{ "success": false, "message": "..." }`
  (development'da qo'shimcha `stack` ham qaytadi).

---

## 3. Papka strukturasi

### Backend (`/backend`)
| Papka | Mas'uliyat |
|-------|------------|
| `config/` | Tashqi ulanishlar sozlamasi (DB pool, SMTP) |
| `routes/` | Endpoint → middleware → controller bog'lanishi |
| `controllers/` | So'rov mantig'i, validatsiya, javob qaytarish |
| `models/` | **Faqat** SQL so'rovlari (parametrli) |
| `middleware/` | `protect`, `authorize`, `optionalAuth`, `upload`, `validate`, `errorHandler` |
| `validators/` | `express-validator` zanjirlari |
| `utils/` | Kichik yordamchilar (`asyncHandler`, `ApiError`, token/OTP generatorlar) |
| `uploads/` | Yuklangan fayllar (versiyaga kiritilmaydi) |
| `migrations/` | SQL sxema fayllari |

### Frontend (`/frontend/src`)
| Papka | Mas'uliyat |
|-------|------------|
| `pages/` | Route'ga bog'langan sahifalar (`owner/`, `admin/` ichki papkalar) |
| `components/` | Qayta ishlatiladigan UI bo'laklari |
| `store/` | Zustand store'lar (auth, toast) |
| `utils/` | API klient, validatorlar, konstantalar, helper'lar |

---

## 4. Kod uslubi

### Backend
- **Controller'lar** `asyncHandler` bilan o'raladi — `try/catch` takrorlanmaydi:
  ```js
  const getVenue = asyncHandler(async (req, res) => {
    const venue = await VenueModel.findById(id);
    if (!venue) throw new ApiError(404, 'To\'yxona topilmadi');
    res.json({ success: true, venue });
  });
  ```
- **Boshqariladigan xatolar** uchun `throw new ApiError(status, message)`.
- **Tranzaksiya** kerak bo'lganda `pool.connect()` + `BEGIN/COMMIT/ROLLBACK` (model ichida).
- **SQL injection** — har doim parametrli so'rovlar (`$1, $2`); saralash/ustun nomlari
  faqat **whitelist** orqali.

### Frontend
- **Funksional komponentlar** + hooklar (`useState`, `useEffect`, `useCallback`).
- **Holat:** server holati `useState`/`useEffect` orqali; global auth/toast — Zustand store.
- **API** har doim `utils/api.js` (axios instance) orqali — token interceptor avtomatik qo'shiladi.
- **Forma:** `errors` obyekti + maydon ostida `field-error`; loading/disabled holatlari aniq.

---

## 5. Kommentariya uslubi

- **Til:** o'zbekcha (loyiha izchilligi uchun).
- **NIMA emas, NEGA** tushuntiriladi (kod o'zi nima qilishini ko'rsatadi).
- **Modul/bo'lim sarlavhasi** — chiziqli blok:
  ```js
  // ---------------------------------------------------------------------------
  //  VenueModel — to'yxona va bog'liq jadvallarni TRANSACTION bilan yozadi.
  //  Sababi: hammasi birga yozilishi yoki birga bekor bo'lishi kerak.
  // ---------------------------------------------------------------------------
  ```
- **Qator izohi** — qisqa, faqat nozik nuqtalarga:
  ```js
  const startOffset = (firstDay.getDay() + 6) % 7; // Dushanba = 0 bo'lishi uchun
  ```
- **SQL fayllarda** har bir jadval ustida nima ekani va muhim cheklovlar izohlanadi.

---

## 6. ESLint sozlamasi (tavsiya)

Kodni statik tekshirish uchun **ESLint** tavsiya etiladi. Backend (Node) va frontend (React)
uchun alohida konfiguratsiya.

### `backend/.eslintrc.json`
```json
{
  "root": true,
  "env": { "node": true, "es2022": true },
  "parserOptions": { "ecmaVersion": 2022, "sourceType": "script" },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_|^next$" }],
    "no-console": "off",
    "eqeqeq": ["error", "smart"],
    "prefer-const": "warn"
  }
}
```

### `frontend/.eslintrc.json`
```json
{
  "root": true,
  "env": { "browser": true, "es2022": true },
  "parserOptions": { "ecmaVersion": 2022, "sourceType": "module", "ecmaFeatures": { "jsx": true } },
  "settings": { "react": { "version": "detect" } },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

O'rnatish (frontend):
```powershell
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
```

---

## 7. Prettier sozlamasi (tavsiya)

Kod formatlash izchilligini **Prettier** ta'minlaydi. Ildizda (`/`) yagona konfiguratsiya:

### `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.prettierignore`
```
node_modules
backend/uploads
frontend/dist
```

O'rnatish va ishlatish:
```powershell
npm install -D prettier
npx prettier --write .
```

> **Asosiy qoidalar:** 2 probel indent, **single quote**, satr oxirida nuqtali vergul,
> ko'p qatorli obyekt/massivda oxirgi vergul (`trailingComma`), maksimal satr eni ~100.

---

## 8. Git kommitlari (tavsiya)

Qisqa, imperativ, mavzu prefiksi bilan:

```
feat(booking): bron yaratish endpointi qo'shildi
fix(auth): OTP eskirgan kodda 400 qaytarsin
refactor(venue): forma VenueForm komponentiga ajratildi
docs: README va kod standartlari qo'shildi
```

Prefiks turlari: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---

> Loyiha haqida umumiy ma'lumot va o'rnatish uchun [README.md](README.md) ga qarang.
