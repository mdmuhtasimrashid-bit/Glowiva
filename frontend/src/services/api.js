import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getCategories: () => api.get(`/products/meta/categories?t=${Date.now()}`),
};

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  delete: (id) => api.delete(`/orders/${id}`),
  getStats: (params = {}) => api.get('/orders/stats/summary', { params }),
  getMyOrders: (params = {}) => api.get('/orders/employee/my-orders', { params }),
};

// Employees API
export const employeesAPI = {
  getAll: (params = {}) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  terminate: (id, data) => api.patch(`/employees/${id}/terminate`, data),
  getSalary: (id, year, month) => api.get(`/employees/${id}/salary/${year}/${month}`),
  getSalarySummary: (year, month) => api.get(`/employees/salary-summary/${year}/${month}`),
  getEmployeeOrders: (id, params = {}) => api.get(`/employees/${id}/orders`, { params }),
  resetCommission: (id) => api.post(`/employees/${id}/reset-commission`),
  getPositions: () => api.get('/employees/meta/positions'),
  getDepartments: () => api.get('/employees/meta/departments'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (params = {}) => api.get('/analytics/sales', { params }),
  getProductPerformance: (params = {}) => api.get('/analytics/products/performance', { params }),
  getProfitLoss: (params = {}) => api.get('/analytics/profit-loss', { params }),
  getInventory: () => api.get('/analytics/inventory'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (imageData, fileName) => api.post('/uploads/image', { imageData, fileName }),
};

// Authentication API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/employee/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;