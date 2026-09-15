-- ============================================================
-- Malligai Garlands — Complete Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'OWNER', 'ADMIN');
CREATE TYPE order_status AS ENUM ('NEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE notification_type AS ENUM (
  'ORDER_CONFIRMED', 'ORDER_ACCEPTED', 'ORDER_PREPARING',
  'ORDER_READY', 'ORDER_COLLECTED', 'NEW_ORDER'
);

-- ── PROFILES ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'CUSTOMER',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    'CUSTOMER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── CATALOG ──────────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  image_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE occasions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  icon          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE garlands (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL DEFAULT '',
  price          DECIMAL(10,2) NOT NULL CHECK (price > 0),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  occasion_id    UUID REFERENCES occasions(id) ON DELETE SET NULL,
  flower_type    TEXT,
  images         TEXT[] NOT NULL DEFAULT '{}',
  video_url      TEXT,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular     BOOLEAN NOT NULL DEFAULT FALSE,
  stock_qty      INTEGER,
  collection_tag TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PICKUP SLOTS ─────────────────────────────────────────────────────────────

CREATE TABLE pickup_slot_configs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  max_orders    INTEGER NOT NULL DEFAULT 5,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pickup_slots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  max_orders    INTEGER NOT NULL DEFAULT 5,
  booked_count  INTEGER NOT NULL DEFAULT 0,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (date, start_time)
);

-- ── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT NOT NULL UNIQUE,
  customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status            order_status NOT NULL DEFAULT 'NEW',
  payment_status    payment_status NOT NULL DEFAULT 'PENDING',
  subtotal          DECIMAL(10,2) NOT NULL,
  total             DECIMAL(10,2) NOT NULL,
  pickup_date       DATE NOT NULL,
  pickup_slot_id    UUID REFERENCES pickup_slots(id) ON DELETE SET NULL,
  pickup_start_time TIME NOT NULL,
  pickup_end_time   TIME NOT NULL,
  payment_id        TEXT,
  payment_order_id  TEXT,
  payment_amount    DECIMAL(10,2),
  payment_at        TIMESTAMPTZ,
  qr_code_url       TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  garland_id     UUID REFERENCES garlands(id) ON DELETE SET NULL,
  garland_name   TEXT NOT NULL,
  garland_image  TEXT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  amount                DECIMAL(10,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'INR',
  status                payment_status NOT NULL DEFAULT 'PENDING',
  method                TEXT,
  metadata              JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WISHLIST ─────────────────────────────────────────────────────────────────

CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  garland_id  UUID NOT NULL REFERENCES garlands(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wishlist_id, garland_id)
);

-- ── REVIEWS ──────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  garland_id  UUID NOT NULL REFERENCES garlands(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  image_url   TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LOYALTY (future) ──────────────────────────────────────────────────────────

CREATE TABLE loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  points      INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('EARNED', 'REDEEMED')),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SERVER-SIDE CART ─────────────────────────────────────────────────────────

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  garland_id  UUID NOT NULL REFERENCES garlands(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, garland_id)
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_garlands_category ON garlands(category_id);
CREATE INDEX idx_garlands_occasion ON garlands(occasion_id);
CREATE INDEX idx_garlands_available ON garlands(is_available);
CREATE INDEX idx_garlands_featured ON garlands(is_featured);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_pickup_slots_date ON pickup_slots(date);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE garlands ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_slots ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE plpgsql SECURITY DEFINER AS $$
  DECLARE role_val user_role;
  BEGIN
    SELECT role INTO role_val FROM profiles WHERE id = auth.uid();
    RETURN role_val;
  END;
$$;

-- Profiles: users can read their own, owner/admin can read all
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (id = auth.uid() OR get_user_role() IN ('OWNER', 'ADMIN'));
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Garlands: public read, admin write
CREATE POLICY "garlands_public_read" ON garlands FOR SELECT USING (TRUE);
CREATE POLICY "garlands_admin_write" ON garlands FOR ALL USING (get_user_role() = 'ADMIN');

-- Pickup slots: public read, admin write
CREATE POLICY "pickup_slots_public_read" ON pickup_slots FOR SELECT USING (TRUE);
CREATE POLICY "pickup_slots_admin_write" ON pickup_slots FOR ALL USING (get_user_role() IN ('ADMIN', 'OWNER'));

-- Orders: customers see own orders, owner/admin see all
CREATE POLICY "orders_customer_read" ON orders FOR SELECT USING (customer_id = auth.uid() OR get_user_role() IN ('OWNER', 'ADMIN'));
CREATE POLICY "orders_customer_insert" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders_owner_update" ON orders FOR UPDATE USING (get_user_role() IN ('OWNER', 'ADMIN'));

-- Order items: follow order access
CREATE POLICY "order_items_read" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR get_user_role() IN ('OWNER', 'ADMIN')))
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);

-- Notifications: users see own
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- Cart: users manage own
CREATE POLICY "cart_own" ON cart_items FOR ALL USING (customer_id = auth.uid());

-- Wishlist: users manage own
CREATE POLICY "wishlist_own" ON wishlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.customer_id = auth.uid())
);

-- Reviews: public read, authenticated customers write (verified purchase only)
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_verified_insert" ON reviews FOR INSERT WITH CHECK (
  customer_id = auth.uid() AND
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid() AND o.status = 'COLLECTED')
);

-- ── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO categories (name, slug, display_order) VALUES
  ('Wedding', 'wedding', 1),
  ('Pooja', 'pooja', 2),
  ('Temple', 'temple', 3),
  ('Birthday', 'birthday', 4),
  ('Festival', 'festival', 5),
  ('Function', 'function', 6);

INSERT INTO occasions (name, slug, icon, display_order) VALUES
  ('Wedding', 'wedding', '💒', 1),
  ('Pooja', 'pooja', '🪔', 2),
  ('Function', 'function', '🎉', 3),
  ('Birthday', 'birthday', '🎂', 4),
  ('Temple', 'temple', '🛕', 5),
  ('Festival', 'festival', '🌟', 6),
  ('Special', 'special', '🌸', 7);

INSERT INTO pickup_slot_configs (day_of_week, start_time, end_time, max_orders) VALUES
  (1, '09:00', '10:00', 5), (1, '10:00', '11:00', 5), (1, '11:00', '12:00', 5),
  (1, '16:00', '17:00', 5), (1, '17:00', '18:00', 5), (1, '18:00', '19:00', 5),
  (2, '09:00', '10:00', 5), (2, '10:00', '11:00', 5), (2, '11:00', '12:00', 5),
  (2, '16:00', '17:00', 5), (2, '17:00', '18:00', 5), (2, '18:00', '19:00', 5),
  (3, '09:00', '10:00', 5), (3, '10:00', '11:00', 5), (3, '11:00', '12:00', 5),
  (3, '16:00', '17:00', 5), (3, '17:00', '18:00', 5), (3, '18:00', '19:00', 5),
  (4, '09:00', '10:00', 5), (4, '10:00', '11:00', 5), (4, '11:00', '12:00', 5),
  (4, '16:00', '17:00', 5), (4, '17:00', '18:00', 5), (4, '18:00', '19:00', 5),
  (5, '09:00', '10:00', 5), (5, '10:00', '11:00', 5), (5, '11:00', '12:00', 5),
  (5, '16:00', '17:00', 5), (5, '17:00', '18:00', 5), (5, '18:00', '19:00', 5),
  (6, '09:00', '10:00', 5), (6, '10:00', '11:00', 5), (6, '11:00', '12:00', 5),
  (6, '16:00', '17:00', 5), (6, '17:00', '18:00', 5), (6, '18:00', '19:00', 5),
  (0, '09:00', '10:00', 5), (0, '10:00', '11:00', 5), (0, '11:00', '12:00', 5);

INSERT INTO garlands (name, slug, description, price, category_id, occasion_id, flower_type, images, is_available, is_featured, is_popular, stock_qty, collection_tag)
VALUES
  (
    'Rose Wedding Garland',
    'rose-wedding-garland',
    'A stunning garland made with fresh red roses, perfect for weddings and special occasions. Each bloom is handpicked for maximum freshness and beauty.',
    650.00,
    (SELECT id FROM categories WHERE slug = 'wedding' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'wedding' LIMIT 1),
    'Rose',
    ARRAY['/images/garland-rose.jpg'],
    TRUE, TRUE, TRUE, 20, 'Wedding Season'
  ),
  (
    'Jasmine Pooja Garland',
    'jasmine-pooja-garland',
    'Fresh jasmine garland with divine fragrance, ideal for daily pooja and temple offerings. The pure white blossoms bring serenity and peace.',
    450.00,
    (SELECT id FROM categories WHERE slug = 'pooja' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'pooja' LIMIT 1),
    'Jasmine',
    ARRAY['/images/garland-jasmine.jpg'],
    TRUE, TRUE, TRUE, 30, NULL
  ),
  (
    'Grand Wedding Garland',
    'grand-wedding-garland',
    'A majestic double-strand garland combining roses, marigolds, and jasmine. Perfect for the main couple at weddings — truly unforgettable.',
    1200.00,
    (SELECT id FROM categories WHERE slug = 'wedding' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'wedding' LIMIT 1),
    'Mixed',
    ARRAY['/images/garland-grand.jpg'],
    TRUE, TRUE, FALSE, 15, 'Wedding Season'
  ),
  (
    'Marigold Temple Garland',
    'marigold-temple-garland',
    'Vibrant golden marigold garland for temple worship. Freshly strung daily to ensure maximum fragrance and color.',
    280.00,
    (SELECT id FROM categories WHERE slug = 'temple' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'temple' LIMIT 1),
    'Marigold',
    ARRAY['/images/garland-marigold.jpg'],
    TRUE, FALSE, TRUE, 50, NULL
  ),
  (
    'Lotus Birthday Garland',
    'lotus-birthday-garland',
    'Delicate lotus and lily garland, elegantly arranged for birthday celebrations. Add a touch of grace to your special day.',
    550.00,
    (SELECT id FROM categories WHERE slug = 'birthday' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'birthday' LIMIT 1),
    'Lotus',
    ARRAY['/images/garland-lotus.jpg'],
    TRUE, FALSE, FALSE, 10, NULL
  ),
  (
    'Navaratri Festival Garland',
    'navaratri-festival-garland',
    'Vibrant multi-colored garland with chrysanthemums, roses, and marigolds celebrating the spirit of Navaratri.',
    750.00,
    (SELECT id FROM categories WHERE slug = 'festival' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'festival' LIMIT 1),
    'Mixed',
    ARRAY['/images/garland-festival.jpg'],
    TRUE, TRUE, TRUE, 25, 'Navaratri'
  ),
  (
    'Chrysanthemum Function Garland',
    'chrysanthemum-function-garland',
    'Beautiful white chrysanthemum garland perfect for felicitation ceremonies, cultural programs, and formal functions.',
    380.00,
    (SELECT id FROM categories WHERE slug = 'function' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'function' LIMIT 1),
    'Chrysanthemum',
    ARRAY['/images/garland-chrysanthemum.jpg'],
    TRUE, FALSE, TRUE, 40, NULL
  ),
  (
    'Kanakambaram Pooja Garland',
    'kanakambaram-pooja-garland',
    'Traditional orange kanakambaram flower garland — a classic offering with deep cultural significance in South Indian households.',
    320.00,
    (SELECT id FROM categories WHERE slug = 'pooja' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'pooja' LIMIT 1),
    'Kanakambaram',
    ARRAY['/images/garland-kanakambaram.jpg'],
    TRUE, FALSE, FALSE, 35, NULL
  ),
  (
    'Royal Bridal Garland Set',
    'royal-bridal-garland-set',
    'An exquisite bridal garland set with fragrant roses, jasmine, and tuberose. Two matching garlands for bride and groom, beautifully crafted.',
    2200.00,
    (SELECT id FROM categories WHERE slug = 'wedding' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'wedding' LIMIT 1),
    'Mixed',
    ARRAY['/images/garland-bridal.jpg'],
    TRUE, TRUE, FALSE, 5, 'Wedding Season'
  ),
  (
    'Tuberose Special Garland',
    'tuberose-special-garland',
    'Luxurious tuberose garland with an intoxicating fragrance. Perfect for special occasions when you want to create an unforgettable impression.',
    890.00,
    (SELECT id FROM categories WHERE slug = 'function' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'special' LIMIT 1),
    'Tuberose',
    ARRAY['/images/garland-tuberose.jpg'],
    TRUE, FALSE, TRUE, 12, NULL
  ),
  (
    'Pongal Harvest Garland',
    'pongal-harvest-garland',
    'Celebrate Pongal with a traditional garland of marigolds and banana flowers. Brings the essence of harvest prosperity into your home.',
    420.00,
    (SELECT id FROM categories WHERE slug = 'festival' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'festival' LIMIT 1),
    'Marigold',
    ARRAY['/images/garland-pongal.jpg'],
    TRUE, FALSE, FALSE, 30, 'Pongal'
  ),
  (
    'Mixed Flower Daily Garland',
    'mixed-flower-daily-garland',
    'Fresh mixed flower garland with seasonal blooms — affordable, fragrant, and perfect for daily devotion or gifting.',
    180.00,
    (SELECT id FROM categories WHERE slug = 'pooja' LIMIT 1),
    (SELECT id FROM occasions WHERE slug = 'pooja' LIMIT 1),
    'Mixed',
    ARRAY['/images/garland-mixed.jpg'],
    TRUE, FALSE, TRUE, 60, NULL
  );

