import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool, CAR_COLS, STATUSES, carDto, isValidId, likeEscape, toIso } from '../db.js';
import { checkCredentials, signToken, requireAdmin } from '../auth.js';
import { todayIST } from '../notify.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!checkCredentials(email, password)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.json({ token: signToken() });
});

// Everything below needs a valid admin token
router.use(requireAdmin);

// The client calls this on page load to check that its saved token is still valid
router.get('/me', (_req, res) => res.json({ ok: true }));

// Reject malformed ids early
router.param('id', (req, res, next, id) => {
  if (!isValidId(id)) return res.status(404).json({ error: 'Not found' });
  next();
});

/* ======================= CARS ======================= */

const imageField = z
  .string()
  .max(450000)
  .refine((v) => /^data:image\/(jpeg|png|webp);base64,/.test(v) || /^https:\/\//.test(v), 'Invalid image')
  .nullable()
  .optional();

const carBody = z.object({
  name: z.string().trim().min(2, 'Car name is required').max(100),
  type: z.string().trim().max(50).optional(),
  is_ac: z.boolean().optional(),
  seats: z.number().int().min(1).max(60),
  rate_per_km: z.number({ invalid_type_error: 'Enter the AC rate per km' }).min(0).max(10000),
  rate_per_km_non_ac: z.number({ invalid_type_error: 'Enter the non-AC rate per km' }).min(0).max(10000).nullable().optional(),
  driver_batta_per_day: z.number().min(0).max(10000).nullable().optional(),
  min_km_per_day: z.number().int().min(0).max(5000).nullable().optional(),
  description: z.string().trim().max(500).optional(),
  image: imageField,
  photos: z.array(imageField).optional(),
  active: z.boolean().optional(),
});

const CAR_FIELDS = ['name', 'type', 'is_ac', 'seats', 'rate_per_km', 'rate_per_km_non_ac', 'driver_batta_per_day', 'min_km_per_day', 'description', 'image', 'photos', 'active'];

async function findCar(id) {
  const [rows] = await pool.query(`SELECT ${CAR_COLS} FROM cars WHERE id = ?`, [id]);
  return rows[0] || null;
}

router.get('/cars', async (_req, res) => {
  const [rows] = await pool.query(`SELECT ${CAR_COLS} FROM cars ORDER BY created_at DESC, id DESC`);
  res.json({ cars: rows.map(carDto) });
});

router.post('/cars', async (req, res) => {
  const parsed = carBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const resolvedType = (d.type || (d.is_ac === false ? 'Non-AC' : 'AC')).trim() || (d.is_ac === false ? 'Non-AC' : 'AC');
  const finalPhotos = Array.isArray(d.photos) ? d.photos.filter(Boolean) : [];
  const photoList = finalPhotos.length ? JSON.stringify(finalPhotos) : null;
  const [r] = await pool.query(
    'INSERT INTO cars (name, type, is_ac, seats, rate_per_km, rate_per_km_non_ac, driver_batta_per_day, min_km_per_day, description, image, photos, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      d.name,
      resolvedType,
      d.is_ac === false ? 0 : 1,
      d.seats,
      d.rate_per_km,
      d.rate_per_km_non_ac ?? d.rate_per_km,
      d.driver_batta_per_day ?? 0,
      d.min_km_per_day ?? null,
      d.description ?? '',
      d.image ?? (finalPhotos[0] ?? null),
      photoList,
      d.active === false ? 0 : 1,
    ]
  );
  res.json({ car: carDto(await findCar(r.insertId)) });
});

router.patch('/cars/:id', async (req, res) => {
  const parsed = carBody.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const sets = [];
  const params = [];
  for (const f of CAR_FIELDS) {
    if (parsed.data[f] !== undefined) {
      if (f === 'photos') {
        const value = Array.isArray(parsed.data[f]) ? parsed.data[f].filter(Boolean) : null;
        sets.push('`photos` = ?');
        params.push(value && value.length ? JSON.stringify(value) : null);
        continue;
      }
      if (f === 'active') {
        sets.push('`active` = ?');
        params.push(parsed.data[f] ? 1 : 0);
        continue;
      }
      if (f === 'is_ac') {
        sets.push('`is_ac` = ?');
        params.push(parsed.data[f] ? 1 : 0);
        continue;
      }
      if (f === 'type' && parsed.data[f] !== undefined) {
        sets.push('`type` = ?');
        params.push((parsed.data[f] || (parsed.data.is_ac === false ? 'Non-AC' : 'AC')).trim() || (parsed.data.is_ac === false ? 'Non-AC' : 'AC'));
        continue;
      }
      sets.push(`\`${f}\` = ?`);
      params.push(parsed.data[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  if (!(await findCar(req.params.id))) return res.status(404).json({ error: 'Not found' });

  await pool.query(`UPDATE cars SET ${sets.join(', ')} WHERE id = ?`, [...params, req.params.id]);
  res.json({ car: carDto(await findCar(req.params.id)) });
});

router.delete('/cars/:id', async (req, res) => {
  await pool.query('DELETE FROM cars WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ===================== INQUIRIES ==================== */

// Shape sent to the frontend
const toDto = (r) => ({
  id: String(r.id),
  name: r.name,
  phone: r.phone,
  email: r.email,
  message: r.message,
  source: r.source,
  car_name: r.car_name,
  car_type: r.car_type,
  car_rate: r.car_rate == null ? null : Number(r.car_rate),
  trip_type: r.trip_type,
  pickup: r.pickup,
  drop: r.drop_location,
  travel_date: r.travel_date,
  passengers: r.passengers,
  status: r.status,
  follow_up_date: r.follow_up_date,
  created_at: toIso(r.created_at),
  note_count: Number(r.note_count || 0),
});

const OPEN_SQL = "status NOT IN ('converted','closed')";

router.get('/inquiries', async (req, res) => {
  const { status, q, followup } = req.query;
  const where = [];
  const params = [];

  if (status && STATUSES.includes(status)) {
    where.push('i.status = ?');
    params.push(status);
  }
  if (followup === 'today') {
    // due today or overdue, and still open
    where.push(`i.follow_up_date IS NOT NULL AND i.follow_up_date <= ? AND i.${OPEN_SQL}`);
    params.push(todayIST());
  }
  if (q && String(q).trim()) {
    const like = `%${likeEscape(String(q).trim().slice(0, 100))}%`;
    where.push('(i.name LIKE ? OR i.phone LIKE ? OR i.message LIKE ? OR i.email LIKE ? OR i.pickup LIKE ? OR i.drop_location LIKE ? OR i.car_name LIKE ?)');
    params.push(like, like, like, like, like, like, like);
  }

  const [rows] = await pool.query(
    `SELECT i.*, (SELECT COUNT(*) FROM notes n WHERE n.inquiry_id = i.id) AS note_count
       FROM inquiries i
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY i.created_at DESC, i.id DESC
       LIMIT 300`,
    params
  );

  const [[counts]] = await pool.query(
    `SELECT
       COALESCE(SUM(status = 'new'), 0) AS new_count,
       COALESCE(SUM(follow_up_date IS NOT NULL AND follow_up_date <= ? AND ${OPEN_SQL}), 0) AS due_count
     FROM inquiries`,
    [todayIST()]
  );

  res.json({
    inquiries: rows.map(toDto),
    counts: { new: Number(counts.new_count), due: Number(counts.due_count) },
  });
});

const patchSchema = z.object({
  status: z.enum(['new', 'contacted', 'follow_up', 'converted', 'closed']).optional(),
  follow_up_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

router.patch('/inquiries/:id', async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });

  const sets = [];
  const params = [];
  if (parsed.data.status !== undefined) {
    sets.push('status = ?');
    params.push(parsed.data.status);
  }
  if (parsed.data.follow_up_date !== undefined) {
    sets.push('follow_up_date = ?');
    params.push(parsed.data.follow_up_date);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

  const [exists] = await pool.query('SELECT id FROM inquiries WHERE id = ?', [req.params.id]);
  if (!exists.length) return res.status(404).json({ error: 'Not found' });

  await pool.query(`UPDATE inquiries SET ${sets.join(', ')} WHERE id = ?`, [...params, req.params.id]);
  res.json({ ok: true });
});

router.delete('/inquiries/:id', async (req, res) => {
  await pool.query('DELETE FROM notes WHERE inquiry_id = ?', [req.params.id]);
  await pool.query('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.get('/inquiries/:id/notes', async (req, res) => {
  const [rows] = await pool.query('SELECT id, note, created_at FROM notes WHERE inquiry_id = ? ORDER BY created_at DESC, id DESC', [req.params.id]);
  res.json({ notes: rows.map((n) => ({ id: String(n.id), note: n.note, created_at: toIso(n.created_at) })) });
});

router.post('/inquiries/:id/notes', async (req, res) => {
  const parsed = z.object({ note: z.string().trim().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Note cannot be empty' });
  const [exists] = await pool.query('SELECT id FROM inquiries WHERE id = ?', [req.params.id]);
  if (!exists.length) return res.status(404).json({ error: 'Not found' });
  await pool.query('INSERT INTO notes (inquiry_id, note) VALUES (?, ?)', [req.params.id, parsed.data.note]);
  res.json({ ok: true });
});

function csvCell(v) {
  let s = v == null ? '' : String(v);
  // stop spreadsheet formula injection
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

router.get('/export.csv', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC, id DESC');
  const data = rows.map(toDto);
  const cols = [
    'id', 'name', 'phone', 'email', 'car_name', 'car_type', 'car_rate', 'trip_type',
    'pickup', 'drop', 'travel_date', 'passengers', 'message', 'source', 'status', 'follow_up_date', 'created_at',
  ];
  const csv = [cols.join(','), ...data.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inquiries.csv"');
  res.send(csv);
});

export default router;
