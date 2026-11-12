import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(email, password) {
  const okEmail = safeEqual(String(email || '').trim().toLowerCase(), String(process.env.ADMIN_EMAIL || '').trim().toLowerCase());
  const okPass = safeEqual(password || '', process.env.ADMIN_PASSWORD || '');
  return okEmail && okPass && !!process.env.ADMIN_PASSWORD;
}

export function signToken() {
  return jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}
