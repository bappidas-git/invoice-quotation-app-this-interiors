import axios from "axios";
import BASE_URL from "./baseURL";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach Bearer token to every request
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

// Response interceptor — normalize Laravel API responses & handle 401 globally
//
// Problem: Laravel API Resources wrap responses in a { data: ... } envelope:
//   - Collections: { data: [...], meta: {...}, links: {...} }
//   - Single resources: { data: { id: 1, ... } }
// But JSON Server (used in development) returns plain arrays/objects directly.
// All components expect response.data to be the array or object itself.
//
// This interceptor unwraps the Laravel envelope so components work with both
// backends without any code changes.
api.interceptors.response.use(
  (response) => {
    const payload = response.data;

    // Unwrap when payload is a non-array object with a `data` property.
    // JSON Server never returns objects with a top-level `data` key for
    // any entity in this app (clients, quotations, invoices, settings, etc.),
    // so this is safe for both backends.
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      response.data = payload.data;
    }

    return response;
  },
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

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
};

// ─────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────
export const clientsAPI = {
  getAll: () => api.get("/clients"),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post("/clients", data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// ─────────────────────────────────────────────
// Scope of Work
// Path changed: /scopeOfWork → /scope-of-work
// routes.json rewrites /scope-of-work → /scopeOfWork for JSON Server
// ─────────────────────────────────────────────
export const scopeOfWorkAPI = {
  getAll: () => api.get("/scope-of-work"),
  getById: (id) => api.get(`/scope-of-work/${id}`),
  create: (data) => api.post("/scope-of-work", data),
  update: (id, data) => api.put(`/scope-of-work/${id}`, data),
  delete: (id) => api.delete(`/scope-of-work/${id}`),
};

// ─────────────────────────────────────────────
// Tasks
// NOTE: getByScopeOfWork uses ?scopeOfWorkId= (camelCase) intentionally —
// this matches the field name in db.json records so JSON Server can filter.
// Laravel must also accept ?scopeOfWorkId= as the query param for this endpoint.
// ─────────────────────────────────────────────
export const tasksAPI = {
  getAll: () => api.get("/tasks"),
  getById: (id) => api.get(`/tasks/${id}`),
  getByScopeOfWork: (scopeOfWorkId) =>
    api.get(`/tasks?scopeOfWorkId=${scopeOfWorkId}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ─────────────────────────────────────────────
// Quotations
// Date params changed: date_gte/date_lte → start_date/end_date
// JSON Server ignores unknown query params and returns all records;
// components that use this handle date filtering client-side as fallback.
// Laravel implements real server-side filtering on these params.
// ─────────────────────────────────────────────
export const quotationsAPI = {
  getAll: () => api.get("/quotations"),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post("/quotations", data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  getByStatus: (status) =>
    api.get(`/quotations?status=${encodeURIComponent(status)}`),
  getByDateRange: (startDate, endDate) =>
    api.get(`/quotations?start_date=${startDate}&end_date=${endDate}`),
};

// ─────────────────────────────────────────────
// Invoices
// NOTE: getByClient uses ?clientId= (camelCase) — matches db.json field name.
// ─────────────────────────────────────────────
export const invoicesAPI = {
  getAll: () => api.get("/invoices"),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post("/invoices", data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getByDateRange: (startDate, endDate) =>
    api.get(`/invoices?start_date=${startDate}&end_date=${endDate}`),
  getByClient: (clientId) => api.get(`/invoices?clientId=${clientId}`),
};

// ─────────────────────────────────────────────
// Bank Accounts
// Path changed: /bankAccounts → /bank-accounts
// ─────────────────────────────────────────────
export const bankAccountsAPI = {
  getAll: () => api.get("/bank-accounts"),
  getById: (id) => api.get(`/bank-accounts/${id}`),
  create: (data) => api.post("/bank-accounts", data),
  update: (id, data) => api.put(`/bank-accounts/${id}`, data),
  delete: (id) => api.delete(`/bank-accounts/${id}`),
};

// ─────────────────────────────────────────────
// Settings — Organization
// Path changed from JSON Server singleton /organizationSettings/1
// to clean REST path /settings/organization.
// routes.json rewrites this to /organizationSettings/1 for JSON Server.
// Laravel implements GET/PUT /settings/organization as a singleton resource.
// ─────────────────────────────────────────────
export const organizationsAPI = {
  get: () => api.get("/settings/organization"),
  update: (data) => api.put("/settings/organization", data),
};

// ─────────────────────────────────────────────
// Settings — Tax
// ─────────────────────────────────────────────
export const taxSettingsAPI = {
  get: () => api.get("/settings/tax"),
  update: (data) => api.put("/settings/tax", data),
};

// ─────────────────────────────────────────────
// Settings — General
// ─────────────────────────────────────────────
export const generalSettingsAPI = {
  get: () => api.get("/settings/general"),
  update: (data) => api.put("/settings/general", data),
};

// ─────────────────────────────────────────────
// BOQ Areas
// Path changed: /boqAreas → /boq-areas
// ─────────────────────────────────────────────
export const boqAreasAPI = {
  getAll: () => api.get("/boq-areas"),
  getById: (id) => api.get(`/boq-areas/${id}`),
  create: (data) => api.post("/boq-areas", data),
  update: (id, data) => api.put(`/boq-areas/${id}`, data),
  delete: (id) => api.delete(`/boq-areas/${id}`),
};

// ─────────────────────────────────────────────
// BOQ Categories
// Path changed: /boqCategories → /boq-categories
// ─────────────────────────────────────────────
export const boqCategoriesAPI = {
  getAll: () => api.get("/boq-categories"),
  getById: (id) => api.get(`/boq-categories/${id}`),
  create: (data) => api.post("/boq-categories", data),
  update: (id, data) => api.put(`/boq-categories/${id}`, data),
  delete: (id) => api.delete(`/boq-categories/${id}`),
};

// ─────────────────────────────────────────────
// BOQs
// NOTE: getByClient uses ?clientId= (camelCase) — matches db.json field name.
// ─────────────────────────────────────────────
export const boqsAPI = {
  getAll: () => api.get("/boqs"),
  getById: (id) => api.get(`/boqs/${id}`),
  create: (data) => api.post("/boqs", data),
  update: (id, data) => api.put(`/boqs/${id}`, data),
  delete: (id) => api.delete(`/boqs/${id}`),
  getByClient: (clientId) => api.get(`/boqs?clientId=${clientId}`),
};

// ─────────────────────────────────────────────
// BOQ Invoices  (was missing from api.js — added here)
// Path: /boq-invoices
// routes.json rewrites to /boqInvoices for JSON Server.
// NOTE: getByBoqId uses ?boqId= and getByClient uses ?clientId= (camelCase)
// to match field names in db.json records.
// ─────────────────────────────────────────────
export const boqInvoicesAPI = {
  getAll: () => api.get("/boq-invoices"),
  getById: (id) => api.get(`/boq-invoices/${id}`),
  create: (data) => api.post("/boq-invoices", data),
  update: (id, data) => api.put(`/boq-invoices/${id}`, data),
  delete: (id) => api.delete(`/boq-invoices/${id}`),
  getByBoqId: (boqId) => api.get(`/boq-invoices?boqId=${boqId}`),
  getByClient: (clientId) => api.get(`/boq-invoices?clientId=${clientId}`),
};

export default api;
