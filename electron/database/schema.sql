-- ============================================================
-- AGENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS agencies (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- WAREHOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id        SERIAL PRIMARY KEY,
    code      VARCHAR(20)  NOT NULL UNIQUE,
    name      VARCHAR(150) NOT NULL,
    agency_id INTEGER      NOT NULL REFERENCES agencies(id),
    type      VARCHAR(20)  NOT NULL
              CHECK (type IN ('RUTA', 'PRINCIPAL', 'PRODUCCION')),
    active    BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(10)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id           SERIAL PRIMARY KEY,
    warehouse_id INTEGER      NOT NULL REFERENCES warehouses(id),
    opened_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    closed_at    TIMESTAMPTZ,
    notes        TEXT,
    created_by   VARCHAR(100)
);

-- ============================================================
-- WEIGHINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS weighings (
    id           SERIAL PRIMARY KEY,
    session_id   INTEGER        REFERENCES sessions(id),
    warehouse_id INTEGER        NOT NULL REFERENCES warehouses(id),
    product_id   INTEGER        NOT NULL REFERENCES products(id),
    weight_kg    NUMERIC(10,3)  NOT NULL,
    captured_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    mode         VARCHAR(10)    NOT NULL DEFAULT 'QUICK'
                 CHECK (mode IN ('SESSION', 'QUICK')),
    raw_data     TEXT
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'operator'
                  CHECK (role IN ('admin', 'operator')),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_weighings_captured_at  ON weighings(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_weighings_warehouse_id ON weighings(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_weighings_product_id   ON weighings(product_id);
CREATE INDEX IF NOT EXISTS idx_weighings_session_id   ON weighings(session_id);

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================
INSERT INTO settings (key, value) VALUES
    ('serial.port',        'COM3'),
    ('serial.baudRate',    '9600'),
    ('serial.dataBits',    '8'),
    ('serial.stopBits',    '1'),
    ('serial.parity',      'none'),
    ('serial.unit',        'kg')
ON CONFLICT (key) DO NOTHING;

-- Always enforce the correct regex for this scale model
-- (safe to re-run: only overwrites if value is the old generic pattern)
INSERT INTO settings (key, value) VALUES
    ('serial.weightRegex', '([0-9]+\.?[0-9]*)\s*KG\s*G')
ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW()
    WHERE settings.value = '([0-9]+\.?[0-9]*)';
