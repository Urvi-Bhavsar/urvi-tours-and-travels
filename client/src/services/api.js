import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🚀 API Request:', config.method.toUpperCase(), config.url, {
    headers: config.headers,
    data: config.data,
    params: config.params,
  });
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Car API calls
export const carAPI = {
  getAll: () => api.get('/cars'),
  getById: (id) => api.get(`/cars/${id}`),
  getAllAdmin: () => api.get('/cars/admin/all'),
  create: (data) => api.post('/cars', data),
  update: (id, data) => api.put(`/cars/${id}`, data),
  delete: (id) => api.delete(`/cars/${id}`),
  toggleVisibility: (id) => api.patch(`/cars/${id}/toggle`),
};

// Inquiry API calls
export const inquiryAPI = {
  create: (data) => api.post('/inquiries', data),
  getAll: (status) => api.get('/inquiries', { params: { status } }),
  getById: (id) => api.get(`/inquiries/${id}`),
  updateStatus: (id, status) => api.patch(`/inquiries/${id}/status`, { status }),
  delete: (id) => api.delete(`/inquiries/${id}`),
  getStats: () => api.get('/inquiries/stats/summary'),
};

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export default api;
