import mysql from 'mysql2/promise';

export const STATUSES = ['new', 'contacted', 'follow_up', 'converted', 'closed'];
export const TRIP_TYPES = ['one_way', 'round_trip', 'local', 'airport'];

const useSsl = process.env.DB_SSL !== 'false'; // TiDB Cloud needs TLS; set DB_SSL=false for a local MySQL
const dbName = process.env.DB_NAME || 'urvi_tours';

const connectionBase = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
};

export const pool = mysql.createPool({
  ...connectionBase,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4',
  dateStrings: true, // DATE -> 'YYYY-MM-DD', TIMESTAMP -> 'YYYY-MM-DD HH:MM:SS'
  decimalNumbers: true, // DECIMAL comes back as a number, not a string
});

// Store and read every timestamp in UTC; the browser converts to local time.
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

// ---------------------------------------------------------------------------
// Schema. Tables are created automatically on server start.
// ---------------------------------------------------------------------------
export async function initDb() {
  // Create the database if it does not exist yet (skipped quietly if the DB user is not allowed to).
  if (/^[A-Za-z0-9_]+$/.test(dbName)) {
    try {
      const boot = await mysql.createConnection(connectionBase);
      await boot.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
      await boot.end();
    } catch (err) {
      console.warn('Could not auto-create the database (continuing):', err.message);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT '',
      is_ac TINYINT(1) NOT NULL DEFAULT 1,
      seats INT NOT NULL DEFAULT 4,
      rate_per_km DECIMAL(10,2) NOT NULL DEFAULT 0,
      rate_per_km_non_ac DECIMAL(10,2) NOT NULL DEFAULT 0,
      driver_batta_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_km_per_day INT NULL,
      description VARCHAR(500) NOT NULL DEFAULT '',
      image MEDIUMTEXT NULL,
      photos MEDIUMTEXT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cars_active (active)
    ) DEFAULT CHARSET = utf8mb4
  `);

  for (const stmt of [
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_ac TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS rate_per_km_non_ac DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_batta_per_day DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE cars ADD COLUMN IF NOT EXISTS photos MEDIUMTEXT NULL",
  ]) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.warn('Car migration skipped:', err.message);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(150) NULL,
      message TEXT NULL,
      source VARCHAR(50) NOT NULL DEFAULT 'direct',
      car_id BIGINT NULL,
      car_name VARCHAR(100) NULL,
      car_type VARCHAR(50) NULL,
      car_rate DECIMAL(10,2) NULL,
      trip_type ENUM('one_way','round_trip','local','airport') NOT NULL DEFAULT 'one_way',
      pickup VARCHAR(200) NULL,
      drop_location VARCHAR(200) NULL,
      travel_date DATE NULL,
      passengers INT NULL,
      status ENUM('new','contacted','follow_up','converted','closed') NOT NULL DEFAULT 'new',
      follow_up_date DATE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_inq_status (status),
      INDEX idx_inq_follow_up (follow_up_date),
      INDEX idx_inq_created (created_at)
    ) DEFAULT CHARSET = utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      inquiry_id BIGINT NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notes_inquiry (inquiry_id)
    ) DEFAULT CHARSET = utf8mb4
  `);
}

// ---------------------------------------------------------------------------
// Helpers shared by the routes
// ---------------------------------------------------------------------------
export const isValidId = (id) => /^\d{1,18}$/.test(String(id));

// 'YYYY-MM-DD HH:MM:SS' (UTC, from MySQL) -> ISO string the browser can parse
export function toIso(ts) {
  if (!ts) return null;
  const d = new Date(`${String(ts).replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Car columns for lists. The photo itself (a big base64 string) is NOT selected here;
// it is served separately from /api/cars/:id/image.
export const CAR_COLS = `id, name, type, is_ac, seats, rate_per_km, rate_per_km_non_ac, driver_batta_per_day, min_km_per_day, description, image, photos, active, updated_at,
  CASE WHEN image IS NULL OR image = '' THEN 0 WHEN image LIKE 'http%' THEN 2 ELSE 1 END AS image_kind,
  CASE WHEN image LIKE 'http%' THEN image ELSE NULL END AS image_link`;

// Shape sent to the frontend
export function carDto(c) {
  let primaryImage = null;
  let photos = [];

  try {
    const parsedPhotos = c.photos ? JSON.parse(c.photos) : [];
    if (Array.isArray(parsedPhotos)) {
      photos = parsedPhotos.filter(Boolean);
    }
  } catch {
    photos = [];
  }

  if (photos.length === 0 && c.image) photos.push(c.image);

  if (c.image_kind === 2) primaryImage = c.image_link;
  else if (c.image_kind === 1) primaryImage = `/api/cars/${c.id}/image?v=${Date.parse(`${String(c.updated_at).replace(' ', 'T')}Z`) || 0}`;
  else if (photos[0]) primaryImage = photos[0];

  if (primaryImage && !photos.includes(primaryImage)) photos.unshift(primaryImage);

  const baseRate = Number(c.rate_per_km || 0);
  const nonAcRate = Number(c.rate_per_km_non_ac ?? baseRate);

  return {
    id: String(c.id),
    name: c.name,
    type: c.type || (c.is_ac ? 'AC' : 'Non-AC'),
    is_ac: !!c.is_ac,
    seats: c.seats,
    rate_per_km: baseRate,
    rate_per_km_non_ac: nonAcRate,
    driver_batta_per_day: Number(c.driver_batta_per_day || 0),
    min_km_per_day: c.min_km_per_day,
    description: c.description || '',
    image_url: primaryImage,
    photos: photos.map((p) => (p.startsWith('/') ? p : p)),
    active: !!c.active,
  };
}

// Escape % and _ so user search text is matched literally in LIKE
export const likeEscape = (s) => s.replace(/[\\%_]/g, '\\$&');
