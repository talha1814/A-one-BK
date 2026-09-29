import axios from 'axios';

// Create Axios client instance
const api = axios.create({
  baseURL: '', // Uses relative URL so Vite proxy or Vercel rewrites forward to /api
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aone_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.code;
      if (code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('aone_token');
        localStorage.removeItem('aone_user');
      }
    }
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Auth Endpoints
export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  getMe: () => api.get('/api/auth/me'),
};

// Products Endpoints
export const productsAPI = {
  getAll: () => api.get('/api/products'),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
};

// Sales Endpoints
export const salesAPI = {
  create: (saleData) => api.post('/api/sales', saleData),
  getToday: () => api.get('/api/sales/today'),
  getDashboard: () => api.get('/api/sales/dashboard'),
  getByDate: (date) => api.get(`/api/sales/date/${date}`),
  getRange: (from, to) => api.get(`/api/sales/range?from=${from || ''}&to=${to || ''}`),
  getReport: (from, to) => api.get(`/api/sales/report?from=${from || ''}&to=${to || ''}`),
  delete: (id) => api.delete(`/api/sales/${id}`),
};

// Expenses Endpoints
export const expensesAPI = {
  create: (data) => api.post('/api/expenses', data),
  getToday: () => api.get('/api/expenses/today'),
  getRange: (from, to) => api.get(`/api/expenses/range?from=${from || ''}&to=${to || ''}`),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
};

// Credits / Udhaar Endpoints
export const creditsAPI = {
  create: (data) => api.post('/api/credits', data),
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return api.get(`/api/credits?${query.toString()}`);
  },
  getUnpaid: () => api.get('/api/credits/unpaid'),
  recordPayment: (id, data) => api.post(`/api/credits/${id}/payment`, data),
  delete: (id) => api.delete(`/api/credits/${id}`),
};

// Admin Endpoints
export const adminAPI = {
  getOverview: () => api.get('/api/admin/overview'),
  getClients: () => api.get('/api/admin/clients'),
  createClient: (data) => api.post('/api/admin/clients', data),
  updateClient: (id, data) => api.put(`/api/admin/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/api/admin/clients/${id}`),
  getReports: (clientId, from, to) => api.get(`/api/admin/reports/${clientId}?from=${from || ''}&to=${to || ''}`),
  closeDay: (data) => api.post('/api/admin/close-day', data),
};

export default api;
