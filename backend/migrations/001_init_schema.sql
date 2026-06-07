-- ============================================================================
--  To'yxona Online Bron Tizimi — Ma'lumotlar bazasi sxemasi (migration)
--  Fayl: 001_init_schema.sql
--  DBMS: PostgreSQL
-- ============================================================================
--  Ishga tushirish:
--    psql -U postgres -d toyxona_db -f 001_init_schema.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
--  ENUM tiplari (rol va statuslar)
-- ---------------------------------------------------------------------------
CREATE TYPE user_role     AS ENUM ('admin', 'owner', 'user');
CREATE TYPE venue_status  AS ENUM ('tasdiqlangan', 'tasdiqlanmagan');
CREATE TYPE booking_status AS ENUM ('endi bo''ladigan', 'bo''lib o''tgan', 'bekor qilingan');
CREATE TYPE service_type  AS ENUM ('singer', 'car');

-- ---------------------------------------------------------------------------
--  1) users — foydalanuvchilar (admin / owner / user)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    surname     VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,                 -- bcrypt hash
    role        user_role    NOT NULL DEFAULT 'user',
    is_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
--  2) venues — to'yxonalar
-- ---------------------------------------------------------------------------
CREATE TABLE venues (
    id             SERIAL         PRIMARY KEY,
    name           VARCHAR(200)   NOT NULL,
    district       VARCHAR(100)   NOT NULL,            -- Toshkent rayoni
    address        TEXT           NOT NULL,
    capacity       INTEGER        NOT NULL CHECK (capacity > 0),       -- sig'im
    price_per_seat NUMERIC(12, 2) NOT NULL CHECK (price_per_seat >= 0),
    phone          VARCHAR(20)    NOT NULL,
    description    TEXT,
    status         venue_status   NOT NULL DEFAULT 'tasdiqlanmagan',
    owner_id       INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_owner    ON venues(owner_id);
CREATE INDEX idx_venues_district ON venues(district);
CREATE INDEX idx_venues_status   ON venues(status);

-- ---------------------------------------------------------------------------
--  3) venue_images — to'yxona suratlari (1 ta to'yxona — bir nechta surat)
-- ---------------------------------------------------------------------------
CREATE TABLE venue_images (
    id        SERIAL  PRIMARY KEY,
    venue_id  INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL
);

CREATE INDEX idx_venue_images_venue ON venue_images(venue_id);

-- ---------------------------------------------------------------------------
--  4) singers — honandalar (to'yxonaga biriktirilgan)
-- ---------------------------------------------------------------------------
CREATE TABLE singers (
    id        SERIAL         PRIMARY KEY,
    venue_id  INTEGER        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name      VARCHAR(150)   NOT NULL,
    price     NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500)
);

CREATE INDEX idx_singers_venue ON singers(venue_id);

-- ---------------------------------------------------------------------------
--  5) cars — mashinalar (kortej)
-- ---------------------------------------------------------------------------
CREATE TABLE cars (
    id        SERIAL         PRIMARY KEY,
    venue_id  INTEGER        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    brand     VARCHAR(150)   NOT NULL,
    price     NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500)
);

CREATE INDEX idx_cars_venue ON cars(venue_id);

-- ---------------------------------------------------------------------------
--  6) menu_items — taom menyusi
-- ---------------------------------------------------------------------------
CREATE TABLE menu_items (
    id       SERIAL       PRIMARY KEY,
    venue_id INTEGER      NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name     VARCHAR(150) NOT NULL
);

CREATE INDEX idx_menu_items_venue ON menu_items(venue_id);

-- ---------------------------------------------------------------------------
--  7) karnay_surnay — har bir to'yxona uchun bitta yozuv (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE karnay_surnay (
    venue_id  INTEGER        PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
    available BOOLEAN        NOT NULL DEFAULT FALSE,
    price     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0)
);

-- ---------------------------------------------------------------------------
--  8) bookings — bronlar
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
    id              SERIAL         PRIMARY KEY,
    venue_id        INTEGER        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id         INTEGER        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    booking_date    DATE           NOT NULL,
    guest_count     INTEGER        NOT NULL CHECK (guest_count > 0),
    total_price     NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    advance_paid    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (advance_paid >= 0),  -- 20% oldindan to'lov
    status          booking_status NOT NULL DEFAULT 'endi bo''ladigan',
    customer_name    VARCHAR(100)  NOT NULL,
    customer_surname VARCHAR(100)  NOT NULL,
    customer_phone   VARCHAR(20)   NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_venue ON bookings(venue_id);
CREATE INDEX idx_bookings_user  ON bookings(user_id);
CREATE INDEX idx_bookings_date  ON bookings(booking_date);

-- Bir to'yxonaga bir sanada faqat BITTA aktiv ('endi bo''ladigan') bron bo'lishi mumkin.
-- Partial (qisman) unique indeks: faqat aktiv bronlarga tegishli, bekor qilingan/o'tgan
-- bronlar takror sanani bloklamaydi.
CREATE UNIQUE INDEX uq_active_booking_per_venue_date
    ON bookings (venue_id, booking_date)
    WHERE status = 'endi bo''ladigan';

-- ---------------------------------------------------------------------------
--  9) booking_services — bronda tanlangan xizmatlar (singer / car)
--     singer_id va car_id dan aynan BITTASI to'ldiriladi.
-- ---------------------------------------------------------------------------
CREATE TABLE booking_services (
    id           SERIAL         PRIMARY KEY,
    booking_id   INTEGER        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_kind service_type   NOT NULL,
    singer_id    INTEGER        REFERENCES singers(id) ON DELETE CASCADE,
    car_id       INTEGER        REFERENCES cars(id)    ON DELETE CASCADE,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),   -- bron paytidagi narx (snapshot)

    -- Aynan bitta xizmat turi bog'lanishini ta'minlash:
    CONSTRAINT chk_one_service CHECK (
        (service_kind = 'singer' AND singer_id IS NOT NULL AND car_id IS NULL) OR
        (service_kind = 'car'    AND car_id   IS NOT NULL AND singer_id IS NULL)
    )
);

CREATE INDEX idx_booking_services_booking ON booking_services(booking_id);

-- ---------------------------------------------------------------------------
--  10) otp_codes — email tasdiqlash kodlari (asosan owner ro'yxatdan o'tishi uchun)
-- ---------------------------------------------------------------------------
CREATE TABLE otp_codes (
    id         SERIAL      PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       VARCHAR(6)  NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_user ON otp_codes(user_id);

COMMIT;

-- ============================================================================
--  Orqaga qaytarish (rollback) — kerak bo'lsa:
--    DROP TABLE IF EXISTS otp_codes, booking_services, bookings, karnay_surnay,
--      menu_items, cars, singers, venue_images, venues, users CASCADE;
--    DROP TYPE IF EXISTS service_type, booking_status, venue_status, user_role;
-- ============================================================================
