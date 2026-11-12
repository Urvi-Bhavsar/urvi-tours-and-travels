import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool, CAR_COLS, TRIP_TYPES, carDto, isValidId } from '../db.js';
import { notifyTelegram, todayIST } from '../notify.js';

const router = Router();

// ---------- Cars shown on the public site ----------
router.get('/cars', async (_req, res) => {
  const [rows] = await pool.query(`SELECT ${CAR_COLS} FROM cars WHERE active = 1 ORDER BY type, rate_per_km`);
  res.json({ cars: rows.map(carDto) });
});

// One car, for the car detail page
router.get('/cars/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Car not found' });
  const [rows] = await pool.query(`SELECT ${CAR_COLS} FROM cars WHERE id = ? AND active = 1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Car not found' });
  res.json({ car: carDto(rows[0]) });
});

// Car photo (decoded from the stored data URL). Versioned by ?v= so it can be cached for a long time.
router.get('/cars/:id/image', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).end();
  const [rows] = await pool.query('SELECT image FROM cars WHERE id = ?', [req.params.id]);
  const m = rows[0]?.image && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(rows[0].image);
  if (!m) return res.status(404).end();
  res.set('Content-Type', m[1]);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(m[2], 'base64'));
});

// ---------- Booking inquiry ----------
// 5 submissions per IP per 15 minutes
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Accepts +91 98765 43210, 098765 43210, 9876543210 -> '9876543210'
function normalizeIndianPhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z.string().trim().min(1, 'Phone is required'),
  email: z.string().trim().email('Invalid email').max(150).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(50).optional(),
  website: z.string().optional(), // honeypot - real users leave this empty

  car_id: z.string().optional(),
  trip_type: z.enum(TRIP_TYPES).default('one_way'),
  pickup: z.string().trim().min(2, 'Enter your pickup location').max(200),
  drop: z.string().trim().max(200).optional(),
  travel_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid travel date')
    .optional(),
  passengers: z.number().int().min(1, 'Passengers must be at least 1').max(60).optional(),
});

const TRIP_LABELS = { one_way: 'One way', round_trip: 'Round trip', local: 'Local / hourly', airport: 'Airport transfer' };

router.post('/inquiries', submitLimiter, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const d = parsed.data;

  // Bots fill hidden fields. Pretend success, store nothing.
  if (d.website) return res.json({ ok: true });

  const phone = normalizeIndianPhone(d.phone);
  if (!phone) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

  if (d.trip_type !== 'local' && !d.drop) return res.status(400).json({ error: 'Enter your drop location' });
  if (d.travel_date && d.travel_date < todayIST()) {
    return res.status(400).json({ error: 'Travel date cannot be in the past' });
  }

  // Look up the chosen car (must exist and be active) and keep a copy of its name and rate
  let car = null;
  if (d.car_id) {
    if (isValidId(d.car_id)) {
      const [rows] = await pool.query(`SELECT ${CAR_COLS} FROM cars WHERE id = ? AND active = 1`, [d.car_id]);
      car = rows[0] || null;
    }
    if (!car) return res.status(400).json({ error: 'That car is no longer available. Please pick another.' });
  }

  const source = (d.source || 'direct').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 50) || 'direct';
  const drop = d.trip_type === 'local' ? null : d.drop || null;

  try {
    await pool.query(
      `INSERT INTO inquiries
         (name, phone, email, message, source, car_id, car_name, car_type, car_rate,
          trip_type, pickup, drop_location, travel_date, passengers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.name, phone, d.email || null, d.message || null, source,
        car?.id ?? null, car?.name ?? null, car?.type ?? null, car ? Number(car.rate_per_km) : null,
        d.trip_type, d.pickup, drop, d.travel_date || null, d.passengers ?? null,
      ]
    );
    res.json({ ok: true });

    // Fire-and-forget alert
    notifyTelegram(
      `🚗 New booking inquiry\n` +
        `Name: ${d.name}\nPhone: ${phone}\n` +
        (car ? `Car: ${car.name} (${car.type}) - Rs ${Number(car.rate_per_km)}/km\n` : 'Car: not chosen\n') +
        `Trip: ${TRIP_LABELS[d.trip_type]}\n` +
        `Pickup: ${d.pickup}\n` +
        (drop ? `Drop: ${drop}\n` : '') +
        (d.travel_date ? `Date: ${d.travel_date}\n` : '') +
        (d.passengers ? `Passengers: ${d.passengers}\n` : '') +
        (d.message ? `Message: ${d.message}\n` : '') +
        `Source: ${source}`
    );
  } catch (err) {
    console.error('Insert inquiry failed', err);
    res.status(500).json({ error: 'Something went wrong. Please call us directly.' });
  }
});

export default router;
