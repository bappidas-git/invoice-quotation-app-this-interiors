import axios from "axios";
import BASE_URL from "./baseURL";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Clients API
export const clientsAPI = {
  getAll: () => api.get("/clients"),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post("/clients", data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Scope of Work API
export const scopeOfWorkAPI = {
  getAll: () => api.get("/scopeOfWork"),
  getById: (id) => api.get(`/scopeOfWork/${id}`),
  create: (data) => api.post("/scopeOfWork", data),
  update: (id, data) => api.put(`/scopeOfWork/${id}`, data),
  delete: (id) => api.delete(`/scopeOfWork/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: () => api.get("/tasks"),
  getById: (id) => api.get(`/tasks/${id}`),
  getByScopeOfWork: (scopeOfWorkId) =>
    api.get(`/tasks?scopeOfWorkId=${scopeOfWorkId}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Quotations API
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

// Invoices API
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

// Settings APIs (DB based)
export const organizationsAPI = {
  get: async () => {
    try {
      const response = await api.get("/organizationSettings/1");
      return response.data;
    } catch (error) {
      // If no settings exist, return default
      return null;
    }
  },
  set: async (payload) => {
    try {
      const existing = await api.get("/organizationSettings/1");
      const response = await api.put("/organizationSettings/1", {
        ...payload,
        id: 1,
      });
      return response.data;
    } catch (error) {
      // If doesn't exist, create it
      const response = await api.post("/organizationSettings", {
        ...payload,
        id: 1,
      });
      return response.data;
    }
  },
};

export const taxSettingsAPI = {
  get: async () => {
    try {
      const response = await api.get("/taxSettings/1");
      return response.data;
    } catch (error) {
      return null;
    }
  },
  set: async (payload) => {
    try {
      const existing = await api.get("/taxSettings/1");
      const response = await api.put("/taxSettings/1", { ...payload, id: 1 });
      return response.data;
    } catch (error) {
      const response = await api.post("/taxSettings", { ...payload, id: 1 });
      return response.data;
    }
  },
};

export const generalSettingsAPI = {
  get: async () => {
    try {
      const response = await api.get("/generalSettings/1");
      return response.data;
    } catch (error) {
      // Return defaults if no settings
      return {
        currency: "AED",
        currencySymbol: "AED",
        quotationPrefix: "QT",
        invoicePrefix: "INV",
        quotationValidDays: 30,
        paymentTerms: "Net 30",
        defaultPaymentMethod: "Bank Transfer",
        fiscalYearStart: "01-01",
        dateFormat: "DD/MM/YYYY",
        timeZone: "Asia/Dubai",
        numberFormat: "1,000.00",
        decimalPlaces: 2,
      };
    }
  },
  set: async (payload) => {
    try {
      const existing = await api.get("/generalSettings/1");
      const response = await api.put("/generalSettings/1", {
        ...payload,
        id: 1,
      });
      return response.data;
    } catch (error) {
      const response = await api.post("/generalSettings", {
        ...payload,
        id: 1,
      });
      return response.data;
    }
  },
};

export default api;
