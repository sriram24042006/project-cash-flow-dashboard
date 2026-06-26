import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  setToken: (token) => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common['Authorization'];
    }
  },

  // Auth Endpoints
  login: (username, password) => client.post('/auth/login', { username, password }),
  verifyToken: () => client.get('/auth/verify'),

  // Admin Endpoints
  getUsers: () => client.get('/admin/users'),
  createUser: (data) => client.post('/admin/users', data),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  getAuditLogs: () => client.get('/admin/audit-logs'),

  // Project Forecasting Endpoints
  getProjects: (params) => client.get('/project_cash_flow_forecasting', { params }),
  getProjectById: (id) => client.get(`/project_cash_flow_forecasting/${id}`),
  getProjectDetail: (id) => client.get(`/project_cash_flow_forecasting/${id}/detail`),
  createProject: (data) => client.post('/project_cash_flow_forecasting', data),
  updateProject: (id, data) => client.put(`/project_cash_flow_forecasting/${id}`, data),
  updateProjectStatus: (id, status) => client.patch(`/project_cash_flow_forecasting/${id}/status`, { status }),

  // Reporting Endpoints
  getSummaryReport: (params) => client.get('/reports/summary', { params }),
  getDashboardSummary: () => client.get('/dashboard/summary'),

  // Payments
  getPayments: () => client.get('/payments'),
  createPayment: (data) => client.post('/payments', data),

  // Inventory
  getInventory: () => client.get('/inventory'),
  createInventory: (data) => client.post('/inventory', data),

  // Contracts
  getContracts: () => client.get('/contracts'),
  createContracts: (data) => client.post('/contracts', data),

  // Customers
  getCustomers: () => client.get('/customers'),
  createCustomer: (data) => client.post('/customers', data),
};

export default client;
