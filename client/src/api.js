const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'admin_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
};

// Car photos come back as "/api/cars/<id>/image?v=..." (served by the API) or a full https URL.
export const assetUrl = (p) => (p && p.startsWith('/') ? `${BASE}${p}` : p);

async function request(path, { method = 'GET', body, auth = false, raw = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your internet and try again.');
  }

  if (res.status === 401 && auth) {
    setToken(null);
    window.dispatchEvent(new Event('auth-expired'));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return raw ? res : res.json();
}

export const api = {
  // public
  listCars: () => request('/api/cars'),
  getCar: (id) => request(`/api/cars/${encodeURIComponent(id)}`),
  submitInquiry: (data) => request('/api/inquiries', { method: 'POST', body: data }),

  // admin
  login: (email, password) => request('/api/admin/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/admin/me', { auth: true }),

  listInquiries: (params) => request(`/api/admin/inquiries?${new URLSearchParams(params)}`, { auth: true }),
  updateInquiry: (id, data) => request(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteInquiry: (id) => request(`/api/admin/inquiries/${id}`, { method: 'DELETE', auth: true }),
  listNotes: (id) => request(`/api/admin/inquiries/${id}/notes`, { auth: true }),
  addNote: (id, note) => request(`/api/admin/inquiries/${id}/notes`, { method: 'POST', body: { note }, auth: true }),

  adminCars: () => request('/api/admin/cars', { auth: true }),
  createCar: (data) => request('/api/admin/cars', { method: 'POST', body: data, auth: true }),
  updateCar: (id, data) => request(`/api/admin/cars/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteCar: (id) => request(`/api/admin/cars/${id}`, { method: 'DELETE', auth: true }),

  async downloadCsv() {
    const res = await request('/api/admin/export.csv', { auth: true, raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inquiries.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
