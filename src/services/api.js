import axios from "axios";
import BASE_URL from "./baseURL";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("auth_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
};

// ──────────────────────────────────────────────
// Clients API
// ──────────────────────────────────────────────
export const clientsAPI = {
  getAll: () => api.get("/clients"),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post("/clients", data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// ──────────────────────────────────────────────
// Scope of Work API
// ──────────────────────────────────────────────
export const scopeOfWorkAPI = {
  getAll: () => api.get("/scopeOfWork"),
  getById: (id) => api.get(`/scopeOfWork/${id}`),
  create: (data) => api.post("/scopeOfWork", data),
  update: (id, data) => api.put(`/scopeOfWork/${id}`, data),
  delete: (id) => api.delete(`/scopeOfWork/${id}`),
};

// ──────────────────────────────────────────────
// Tasks API
// ──────────────────────────────────────────────
export const tasksAPI = {
  getAll: () => api.get("/tasks"),
  getById: (id) => api.get(`/tasks/${id}`),
  getByScopeOfWork: (scopeOfWorkId) =>
    api.get(`/tasks?scopeOfWorkId=${scopeOfWorkId}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ──────────────────────────────────────────────
// Quotations API
// ──────────────────────────────────────────────
export const quotationsAPI = {
  getAll: () => api.get("/quotations"),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post("/quotations", data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  getByStatus: (status) => api.get(`/quotations?status=${status}`),
  getByDateRange: (startDate, endDate) =>
    api.get(`/quotations?date_gte=${startDate}&date_lte=${endDate}`),
};

// ──────────────────────────────────────────────
// Invoices API
// ──────────────────────────────────────────────
export const invoicesAPI = {
  getAll: () => api.get("/invoices"),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post("/invoices", data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getByDateRange: (startDate, endDate) =>
    api.get(`/invoices?date_gte=${startDate}&date_lte=${endDate}`),
  getByClient: (clientId) => api.get(`/invoices?clientId=${clientId}`),
};

// ──────────────────────────────────────────────
// Bank Accounts API
// ──────────────────────────────────────────────
export const bankAccountsAPI = {
  getAll: () => api.get("/bankAccounts"),
  getById: (id) => api.get(`/bankAccounts/${id}`),
  create: (data) => api.post("/bankAccounts", data),
  update: (id, data) => api.put(`/bankAccounts/${id}`, data),
  delete: (id) => api.delete(`/bankAccounts/${id}`),
};

// ──────────────────────────────────────────────
// Organization Settings API
// ──────────────────────────────────────────────
export const organizationsAPI = {
  get: () => api.get("/organizationSettings/1"),
  update: (data) => api.put("/organizationSettings/1", { ...data, id: 1 }),
};

// ──────────────────────────────────────────────
// Tax Settings API
// ──────────────────────────────────────────────
export const taxSettingsAPI = {
  get: () => api.get("/taxSettings/1"),
  update: (data) => api.put("/taxSettings/1", { ...data, id: 1 }),
};

// ──────────────────────────────────────────────
// BOQ Areas API
// ──────────────────────────────────────────────
export const boqAreasAPI = {
  getAll: () => api.get("/boqAreas"),
  getById: (id) => api.get(`/boqAreas/${id}`),
  create: (data) => api.post("/boqAreas", data),
  update: (id, data) => api.put(`/boqAreas/${id}`, data),
  delete: (id) => api.delete(`/boqAreas/${id}`),
};

// ──────────────────────────────────────────────
// BOQ Categories API
// ──────────────────────────────────────────────
export const boqCategoriesAPI = {
  getAll: () => api.get("/boqCategories"),
  getById: (id) => api.get(`/boqCategories/${id}`),
  create: (data) => api.post("/boqCategories", data),
  update: (id, data) => api.put(`/boqCategories/${id}`, data),
  delete: (id) => api.delete(`/boqCategories/${id}`),
};

// ──────────────────────────────────────────────
// BOQs API
// ──────────────────────────────────────────────
export const boqsAPI = {
  getAll: () => api.get("/boqs"),
  getById: (id) => api.get(`/boqs/${id}`),
  create: (data) => api.post("/boqs", data),
  update: (id, data) => api.put(`/boqs/${id}`, data),
  delete: (id) => api.delete(`/boqs/${id}`),
  getByClient: (clientId) => api.get(`/boqs?clientId=${clientId}`),
};

// ──────────────────────────────────────────────
// General Settings API
// ──────────────────────────────────────────────
export const generalSettingsAPI = {
  get: () => api.get("/generalSettings/1"),
  update: (data) => api.put("/generalSettings/1", { ...data, id: 1 }),
};

export default api;
