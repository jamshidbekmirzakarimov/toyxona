// ---------------------------------------------------------------------------
//  OpenAPI (Swagger) spetsifikatsiyasi — barcha endpointlar.
//  /api/docs da interaktiv hujjat sifatida ko'rsatiladi.
//  Frontendchi: "Authorize" tugmasiga JWT token qo'yib, himoyalangan
//  endpointlarni ham to'g'ridan-to'g'ri sinab ko'rishi mumkin.
// ---------------------------------------------------------------------------

const bearer = [{ bearerAuth: [] }];

// Qisqa javob namunalari (qayta ishlatish uchun)
const ok = (description) => ({ description });
const errorResponse = {
  description: 'Xatolik',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: "To'yxona Online Bron Tizimi — API",
    version: '1.0.0',
    description:
      "To'yxonalarni ko'rish va bron qilish tizimi REST API.\n\n" +
      '**Autentifikatsiya:** himoyalangan endpointlar uchun `/auth/login` dan token oling, ' +
      "so'ng yuqoridagi **Authorize** tugmasiga `Bearer <token>` ni qo'ying.\n\n" +
      'Test akkauntlar: `admin/admin123`, `owner1/owner123`, `user1/user123`.',
  },
  servers: [{ url: '/api', description: 'Local (/api)' }],
  tags: [
    { name: 'Auth', description: 'Ro\'yxatdan o\'tish, kirish, OTP' },
    { name: 'Venues', description: 'To\'yxonalar (ommaviy ko\'rish + qo\'shish)' },
    { name: 'Bookings', description: 'Bronlar' },
    { name: 'Owner', description: 'To\'yxona egasi paneli' },
    { name: 'Admin', description: 'Admin paneli' },
    { name: 'Health', description: 'Server holati' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Xatolik xabari' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'surname', 'email', 'username', 'password'],
        properties: {
          name: { type: 'string', example: 'Ali' },
          surname: { type: 'string', example: 'Valiyev' },
          email: { type: 'string', example: 'ali@mail.uz' },
          username: { type: 'string', example: 'ali' },
          password: { type: 'string', minLength: 6, example: '123456' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      VerifyOtpInput: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', example: 'owner@mail.uz' },
          code: { type: 'string', example: '123456' },
        },
      },
      BookingInput: {
        type: 'object',
        required: ['venue_id', 'booking_date', 'guest_count', 'customer_name', 'customer_surname', 'customer_phone'],
        properties: {
          venue_id: { type: 'integer', example: 1 },
          booking_date: { type: 'string', format: 'date', example: '2026-09-15' },
          guest_count: { type: 'integer', example: 250 },
          selected_services: {
            type: 'object',
            properties: {
              singers: { type: 'array', items: { type: 'integer' }, example: [1] },
              cars: { type: 'array', items: { type: 'integer' }, example: [1] },
            },
          },
          karnay_surnay: { type: 'boolean', example: true },
          customer_name: { type: 'string', example: 'Ali' },
          customer_surname: { type: 'string', example: 'Valiyev' },
          customer_phone: { type: 'string', example: '+998901234567' },
        },
      },
      OwnerInput: {
        type: 'object',
        required: ['name', 'surname', 'email', 'username', 'password'],
        properties: {
          name: { type: 'string', example: 'Sardor' },
          surname: { type: 'string', example: 'Karimov' },
          email: { type: 'string', example: 'sardor@mail.uz' },
          username: { type: 'string', example: 'sardor' },
          password: { type: 'string', minLength: 6, example: 'owner123' },
        },
      },
      VenueEditInput: {
        type: 'object',
        required: ['name', 'district', 'address', 'capacity', 'price_per_seat', 'phone'],
        properties: {
          name: { type: 'string', example: 'Bahor To\'yxonasi' },
          district: { type: 'string', example: 'Yunusobod' },
          address: { type: 'string', example: 'Amir Temur ko\'chasi 12' },
          capacity: { type: 'integer', example: 300 },
          price_per_seat: { type: 'number', example: 50000 },
          phone: { type: 'string', example: '+998901112233' },
          description: { type: 'string', example: 'Zamonaviy to\'yxona' },
          singers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
                image_url: { type: 'string', nullable: true },
              },
            },
            example: [{ name: 'Anvar', price: 2000000, image_url: null }],
          },
          cars: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                brand: { type: 'string' },
                price: { type: 'number' },
                image_url: { type: 'string', nullable: true },
              },
            },
            example: [{ brand: 'Cobalt', price: 500000, image_url: null }],
          },
          menu_items: { type: 'array', items: { type: 'string' }, example: ['Osh', 'Shashlik'] },
          karnay_surnay: {
            type: 'object',
            nullable: true,
            properties: {
              available: { type: 'boolean' },
              price: { type: 'number' },
            },
            example: { available: true, price: 500000 },
          },
        },
      },
      AssignOwnerInput: {
        type: 'object',
        required: ['owner_id'],
        properties: { owner_id: { type: 'integer', example: 2 } },
      },
      // Multipart (rasm bilan to'yxona qo'shish) — singers/cars/menu_items/karnay_surnay JSON-string
      VenueCreateMultipart: {
        type: 'object',
        required: ['name', 'district', 'address', 'capacity', 'price_per_seat', 'phone'],
        properties: {
          name: { type: 'string' },
          district: { type: 'string' },
          address: { type: 'string' },
          capacity: { type: 'integer' },
          price_per_seat: { type: 'number' },
          phone: { type: 'string' },
          description: { type: 'string' },
          singers: { type: 'string', description: 'JSON: [{"name","price"}]', example: '[{"name":"Anvar","price":2000000}]' },
          cars: { type: 'string', description: 'JSON: [{"brand","price"}]', example: '[{"brand":"Cobalt","price":500000}]' },
          menu_items: { type: 'string', description: 'JSON: ["Osh","Shashlik"]', example: '["Osh","Shashlik"]' },
          karnay_surnay: { type: 'string', description: 'JSON: {"available","price"} yoki null', example: '{"available":true,"price":500000}' },
          images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'To\'yxona suratlari' },
          singerImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Honanda suratlari (singers tartibida)' },
          carImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Mashina suratlari (cars tartibida)' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: { tags: ['Health'], summary: 'Server holati', responses: { 200: ok('OK') } },
    },

    // ---------- AUTH ----------
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Oddiy user ro\'yxatdan o\'tishi',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
        responses: { 201: ok('Yaratildi'), 400: errorResponse, 409: errorResponse },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Kirish (token yoki owner uchun OTP)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: { 200: ok('Token yoki { requireOtp: true }'), 400: errorResponse, 401: errorResponse },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Owner email OTP tasdiqlash -> token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyOtpInput' } } } },
        responses: { 200: ok('Token'), 400: errorResponse, 404: errorResponse },
      },
    },

    // ---------- VENUES ----------
    '/venues': {
      get: {
        tags: ['Venues'],
        summary: 'To\'yxonalar ro\'yxati (qidiruv/filtr/sort)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Nom bo\'yicha' },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['tasdiqlangan', 'tasdiqlanmagan'] }, description: 'Faqat admin uchun' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['price', 'capacity'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: ok('To\'yxonalar ro\'yxati (thumbnail bilan)') },
      },
      post: {
        tags: ['Venues'],
        summary: 'Yangi to\'yxona (admin/owner, rasm bilan)',
        security: bearer,
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/VenueCreateMultipart' } } } },
        responses: { 201: ok('Yaratildi'), 400: errorResponse, 401: errorResponse, 403: errorResponse },
      },
    },
    '/venues/{id}': {
      get: {
        tags: ['Venues'],
        summary: 'Yakka to\'yxona to\'liq ma\'lumoti + bronlar',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('To\'liq ma\'lumot'), 404: errorResponse },
      },
    },
    '/venues/{id}/calendar': {
      get: {
        tags: ['Venues'],
        summary: '12 oylik bron kalendari (free/booked/past)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('Kalendar massivi'), 404: errorResponse },
      },
    },

    // ---------- BOOKINGS ----------
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Bron yaratish',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingInput' } } } },
        responses: { 201: ok('Bron yaratildi (avans bilan)'), 400: errorResponse, 401: errorResponse, 409: ok('Sana band') },
      },
    },
    '/bookings/my': {
      get: { tags: ['Bookings'], summary: 'Mening bronlarim', security: bearer, responses: { 200: ok('Bronlar'), 401: errorResponse } },
    },
    '/bookings/{id}': {
      delete: {
        tags: ['Bookings'],
        summary: 'Bronni bekor qilish (egasi/owner/admin)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('Bekor qilindi'), 401: errorResponse, 403: errorResponse, 404: errorResponse },
      },
    },

    // ---------- OWNER ----------
    '/owner/venues': {
      get: { tags: ['Owner'], summary: 'O\'z to\'yxonalarim (statuslar bilan)', security: bearer, responses: { 200: ok('Ro\'yxat'), 403: errorResponse } },
      post: {
        tags: ['Owner'],
        summary: 'O\'z to\'yxonasini qo\'shish (rasm bilan)',
        security: bearer,
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/VenueCreateMultipart' } } } },
        responses: { 201: ok('Yaratildi (tasdiqlanmagan)'), 400: errorResponse, 403: errorResponse },
      },
    },
    '/owner/venues/{id}': {
      put: {
        tags: ['Owner'],
        summary: 'O\'z to\'yxonasini tahrirlash (xizmatlar bilan)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VenueEditInput' } } } },
        responses: { 200: ok('Yangilandi'), 400: errorResponse, 403: errorResponse, 404: errorResponse },
      },
    },
    '/owner/bookings': {
      get: { tags: ['Owner'], summary: 'To\'yxonalarimdagi bronlar', security: bearer, responses: { 200: ok('Bronlar'), 403: errorResponse } },
    },
    '/owner/bookings/{id}': {
      delete: {
        tags: ['Owner'],
        summary: 'O\'z to\'yxonasidagi bronni bekor qilish',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('Bekor qilindi'), 403: errorResponse, 404: errorResponse },
      },
    },

    // ---------- ADMIN ----------
    '/admin/owners': {
      get: { tags: ['Admin'], summary: 'Barcha egalar', security: bearer, responses: { 200: ok('Egalar'), 403: errorResponse } },
      post: {
        tags: ['Admin'],
        summary: 'Yangi ega yaratish',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OwnerInput' } } } },
        responses: { 201: ok('Yaratildi'), 400: errorResponse, 403: errorResponse, 409: errorResponse },
      },
    },
    '/admin/venues/{id}/assign': {
      put: {
        tags: ['Admin'],
        summary: 'To\'yxonaga egani biriktirish',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignOwnerInput' } } } },
        responses: { 200: ok('Biriktirildi'), 400: errorResponse, 403: errorResponse, 404: errorResponse },
      },
    },
    '/admin/venues/{id}/approve': {
      put: {
        tags: ['Admin'],
        summary: 'To\'yxonani tasdiqlash',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('Tasdiqlandi'), 403: errorResponse, 404: errorResponse },
      },
    },
    '/admin/venues/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'To\'yxonani (xizmatlar bilan) tahrirlash',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VenueEditInput' } } } },
        responses: { 200: ok('Yangilandi'), 400: errorResponse, 403: errorResponse, 404: errorResponse },
      },
      delete: {
        tags: ['Admin'],
        summary: 'To\'yxonani o\'chirish',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('O\'chirildi'), 403: errorResponse, 404: errorResponse },
      },
    },
    '/admin/bookings': {
      get: {
        tags: ['Admin'],
        summary: 'Barcha bronlar (filtr/sort)',
        security: bearer,
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'venue_id', in: 'query', schema: { type: 'integer' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['endi bo\'ladigan', 'bo\'lib o\'tgan', 'bekor qilingan'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['date', 'venue', 'district', 'status', 'total', 'created'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: ok('Bronlar'), 403: errorResponse },
      },
    },
    '/admin/bookings/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Istalgan bronni bekor qilish',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: ok('Bekor qilindi'), 403: errorResponse, 404: errorResponse },
      },
    },
  },
};

module.exports = swaggerSpec;
