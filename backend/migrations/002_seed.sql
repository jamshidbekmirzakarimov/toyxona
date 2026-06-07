-- ============================================================================
--  To'yxona — Test ma'lumotlari (SEED)
--  Fayl: 002_seed.sql
--  Avval 001_init_schema.sql ishga tushirilgan bo'lishi kerak.
--
--  Supabase: SQL Editor -> bu faylni to'liq paste qilib RUN bosing.
--  Parollar pgcrypto (bcrypt) orqali generatsiya qilinadi -> bcryptjs bilan mos.
-- ============================================================================

-- bcrypt uchun pgcrypto (Supabase'da mavjud)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ---------------------------------------------------------------------------
--  1) Foydalanuvchilar
--  Parollar: admin -> admin123,  owner1/owner2 -> owner123,  user1/user2 -> user123
-- ---------------------------------------------------------------------------
INSERT INTO users (name, surname, email, username, password, role, is_verified) VALUES
  ('Admin',  'Adminov',   'admin@toyxona.uz',  'admin',  crypt('admin123', gen_salt('bf', 10)), 'admin', TRUE),
  ('Sardor', 'Karimov',   'owner1@toyxona.uz', 'owner1', crypt('owner123', gen_salt('bf', 10)), 'owner', TRUE),
  ('Jasur',  'Toshmatov', 'owner2@toyxona.uz', 'owner2', crypt('owner123', gen_salt('bf', 10)), 'owner', TRUE),
  ('Ali',    'Valiyev',   'user1@toyxona.uz',  'user1',  crypt('user123',  gen_salt('bf', 10)), 'user',  FALSE),
  ('Vali',   'Aliyev',    'user2@toyxona.uz',  'user2',  crypt('user123',  gen_salt('bf', 10)), 'user',  FALSE);

-- ---------------------------------------------------------------------------
--  2) To'yxonalar (owner username bo'yicha biriktiriladi)
-- ---------------------------------------------------------------------------
INSERT INTO venues (name, district, address, capacity, price_per_seat, phone, description, status, owner_id) VALUES
  ('Bahor To''yxonasi', 'Yunusobod', 'Yunusobod tumani, Amir Temur ko''chasi 12', 300, 50000, '+998901112233',
   'Zamonaviy va keng to''yxona, bog'' hududi bilan.', 'tasdiqlangan',
   (SELECT id FROM users WHERE username = 'owner1')),

  ('Guliston Saroyi', 'Chilonzor', 'Chilonzor tumani, Bunyodkor shoh ko''chasi 45', 500, 75000, '+998901114455',
   'Katta marosimlar uchun hashamatli saroy.', 'tasdiqlangan',
   (SELECT id FROM users WHERE username = 'owner1')),

  ('Navro''z Bazmgoh', 'Mirzo Ulug''bek', 'Mirzo Ulug''bek tumani, Buyuk Ipak Yo''li 8', 200, 40000, '+998901116677',
   'Kichik va o''rta tadbirlar uchun qulay.', 'tasdiqlanmagan',
   (SELECT id FROM users WHERE username = 'owner2'));

-- ---------------------------------------------------------------------------
--  3) To'yxona suratlari (tashqi placeholder URL'lar)
-- ---------------------------------------------------------------------------
INSERT INTO venue_images (venue_id, image_url) VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'https://picsum.photos/seed/bahor1/900/600'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'https://picsum.photos/seed/bahor2/900/600'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'https://picsum.photos/seed/guliston1/900/600'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'https://picsum.photos/seed/guliston2/900/600'),
  ((SELECT id FROM venues WHERE name = 'Navro''z Bazmgoh'),  'https://picsum.photos/seed/navroz1/900/600');

-- ---------------------------------------------------------------------------
--  4) Honandalar
-- ---------------------------------------------------------------------------
INSERT INTO singers (venue_id, name, price, image_url) VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Anvar',   2000000, 'https://picsum.photos/seed/anvar/300/300'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Dilnoza', 1500000, 'https://picsum.photos/seed/dilnoza/300/300'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'Yulduz',  3000000, 'https://picsum.photos/seed/yulduz/300/300');

-- ---------------------------------------------------------------------------
--  5) Mashinalar
-- ---------------------------------------------------------------------------
INSERT INTO cars (venue_id, brand, price, image_url) VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Cobalt',   500000, 'https://picsum.photos/seed/cobalt/300/300'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Malibu',   800000, 'https://picsum.photos/seed/malibu/300/300'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'Mercedes', 1200000, 'https://picsum.photos/seed/mercedes/300/300');

-- ---------------------------------------------------------------------------
--  6) Menyu
-- ---------------------------------------------------------------------------
INSERT INTO menu_items (venue_id, name) VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Osh'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Shashlik'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Achchiq-chuchuk salat'),
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), 'Shirinlik'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'Osh'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'Norin'),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   'Manti');

-- ---------------------------------------------------------------------------
--  7) Karnay-surnay (1:1)
-- ---------------------------------------------------------------------------
INSERT INTO karnay_surnay (venue_id, available, price) VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'), TRUE, 500000),
  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),   TRUE, 700000),
  ((SELECT id FROM venues WHERE name = 'Navro''z Bazmgoh'),  FALSE, 0);

-- ---------------------------------------------------------------------------
--  8) Bronlar (kelgusi sanalar, aktiv)
-- ---------------------------------------------------------------------------
INSERT INTO bookings
  (venue_id, user_id, booking_date, guest_count, total_price, advance_paid, status,
   customer_name, customer_surname, customer_phone)
VALUES
  ((SELECT id FROM venues WHERE name = 'Bahor To''yxonasi'),
   (SELECT id FROM users WHERE username = 'user1'),
   '2026-07-15', 250, 15000000, 3000000, 'endi bo''ladigan', 'Ali', 'Valiyev', '+998901112233'),

  ((SELECT id FROM venues WHERE name = 'Guliston Saroyi'),
   (SELECT id FROM users WHERE username = 'user2'),
   '2026-08-20', 400, 33000000, 6600000, 'endi bo''ladigan', 'Vali', 'Aliyev', '+998901114455');

-- ---------------------------------------------------------------------------
--  9) Bronda tanlangan xizmatlar (booking_services)
-- ---------------------------------------------------------------------------
-- Bahor broni: Anvar (honanda) + Cobalt (mashina)
INSERT INTO booking_services (booking_id, service_kind, singer_id, car_id, price) VALUES
  (
    (SELECT id FROM bookings
       WHERE venue_id = (SELECT id FROM venues WHERE name = 'Bahor To''yxonasi')
         AND booking_date = '2026-07-15'),
    'singer',
    (SELECT id FROM singers
       WHERE name = 'Anvar'
         AND venue_id = (SELECT id FROM venues WHERE name = 'Bahor To''yxonasi')),
    NULL,
    2000000
  ),
  (
    (SELECT id FROM bookings
       WHERE venue_id = (SELECT id FROM venues WHERE name = 'Bahor To''yxonasi')
         AND booking_date = '2026-07-15'),
    'car',
    NULL,
    (SELECT id FROM cars
       WHERE brand = 'Cobalt'
         AND venue_id = (SELECT id FROM venues WHERE name = 'Bahor To''yxonasi')),
    500000
  );

-- Guliston broni: Yulduz (honanda)
INSERT INTO booking_services (booking_id, service_kind, singer_id, car_id, price) VALUES
  (
    (SELECT id FROM bookings
       WHERE venue_id = (SELECT id FROM venues WHERE name = 'Guliston Saroyi')
         AND booking_date = '2026-08-20'),
    'singer',
    (SELECT id FROM singers
       WHERE name = 'Yulduz'
         AND venue_id = (SELECT id FROM venues WHERE name = 'Guliston Saroyi')),
    NULL,
    3000000
  );

COMMIT;

-- ============================================================================
--  Test kirish ma'lumotlari:
--    admin  / admin123   (admin)
--    owner1 / owner123   (owner, tasdiqlangan)
--    owner2 / owner123   (owner)
--    user1  / user123    (user)
--    user2  / user123    (user)
-- ============================================================================
