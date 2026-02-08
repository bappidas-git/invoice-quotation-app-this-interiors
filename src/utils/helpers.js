import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";

import {
  organizationsAPI,
  taxSettingsAPI,
  generalSettingsAPI,
} from "../services/api";

// Cache for settings to avoid multiple API calls
let settingsCache = {
  organization: null,
  tax: null,
  general: null,
  lastFetch: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default settings used when API call fails
const DEFAULT_GENERAL_SETTINGS = {
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

export const getOrgProfile = async () => {
  if (
    settingsCache.organization &&
    settingsCache.lastFetch &&
    Date.now() - settingsCache.lastFetch < CACHE_DURATION
  ) {
    return settingsCache.organization;
  }
  try {
    const response = await organizationsAPI.get();
    settingsCache.organization = response.data;
    settingsCache.lastFetch = Date.now();
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getTaxSettings = async () => {
  if (
    settingsCache.tax &&
    settingsCache.lastFetch &&
    Date.now() - settingsCache.lastFetch < CACHE_DURATION
  ) {
    return settingsCache.tax;
  }
  try {
    const response = await taxSettingsAPI.get();
    settingsCache.tax = response.data;
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getGeneralSettings = async () => {
  if (
    settingsCache.general &&
    settingsCache.lastFetch &&
    Date.now() - settingsCache.lastFetch < CACHE_DURATION
  ) {
    return settingsCache.general;
  }
  try {
    const response = await generalSettingsAPI.get();
    settingsCache.general = response.data;
    return response.data;
  } catch (error) {
    return DEFAULT_GENERAL_SETTINGS;
  }
};

// Clear cache when settings are updated
export const clearSettingsCache = () => {
  settingsCache = {
    organization: null,
    tax: null,
    general: null,
    lastFetch: null,
  };
};

export const applyTaxCalculations = (subtotal, taxSettings) => {
  if (!taxSettings) {
    return {
      taxLabel: "Tax",
      taxPercent: 0,
      serviceTaxPercent: 0,
      taxAmount: 0,
      serviceTaxAmount: 0,
      total: subtotal,
    };
  }

  const taxAmount = subtotal * ((Number(taxSettings.taxPercent) || 0) / 100);
  const serviceTaxAmount = taxSettings.serviceTaxEnabled
    ? subtotal * ((Number(taxSettings.serviceTaxPercent) || 0) / 100)
    : 0;
  const total = subtotal + taxAmount + serviceTaxAmount;

  return {
    taxLabel: taxSettings.taxLabel || "Tax",
    taxPercent: Number(taxSettings.taxPercent) || 0,
    serviceTaxPercent: Number(taxSettings.serviceTaxPercent) || 0,
    taxAmount,
    serviceTaxAmount,
    total,
  };
};

// For backward compatibility
export const applyOrgTaxes = async (subtotal, orgProfile = null) => {
  const taxSettings = orgProfile || (await getTaxSettings());
  return applyTaxCalculations(subtotal, taxSettings);
};

export const formatDate = (date, customFormat = null) => {
  if (!date) return "";
  const settings = settingsCache.general || { dateFormat: "DD/MM/YYYY" };
  const dateFormat = settings.dateFormat || "DD/MM/YYYY";

  // Convert format string to date-fns format
  const formatMap = {
    "DD/MM/YYYY": "dd/MM/yyyy",
    "MM/DD/YYYY": "MM/dd/yyyy",
    "YYYY-MM-DD": "yyyy-MM-dd",
    "DD-MM-YYYY": "dd-MM-yyyy",
  };

  return format(
    new Date(date),
    customFormat || formatMap[dateFormat] || "dd/MM/yyyy"
  );
};

export const formatDateTime = (date) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm");
};

export const formatCurrency = (amount, currency = null) => {
  const settings = settingsCache.general || { currency: "AED" };
  const curr = currency || settings.currency || "AED";

  return `${curr} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const getDateRange = (filter) => {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case "Today":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case "Last Week":
      startDate = startOfDay(subWeeks(now, 1));
      endDate = endOfDay(now);
      break;
    case "Last Month":
      startDate = startOfDay(subMonths(now, 1));
      endDate = endOfDay(now);
      break;
    default:
      startDate = startOfDay(subMonths(now, 1));
      endDate = endOfDay(now);
  }

  return { startDate, endDate };
};

export const filterByDateRange = (
  items,
  startDate,
  endDate,
  dateField = "date"
) => {
  if (!startDate || !endDate) return items;

  return items.filter((item) => {
    const itemDate = new Date(item[dateField]);
    return isWithinInterval(itemDate, {
      start: new Date(startDate),
      end: new Date(endDate),
    });
  });
};

export const generateQuotationNumber = async (lastNumber = 0) => {
  const settings = await getGeneralSettings();
  const prefix = settings?.quotationPrefix || "QT";
  const year = new Date().getFullYear();
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${nextNumber}`;
};

export const generateInvoiceNumber = async (lastNumber = 0) => {
  const settings = await getGeneralSettings();
  const prefix = settings?.invoicePrefix || "INV";
  const year = new Date().getFullYear();
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${nextNumber}`;
};

export const generateBoqNumber = async (lastNumber = 0) => {
  const settings = await getGeneralSettings();
  const prefix = settings?.boqPrefix || "BOQ";
  const year = new Date().getFullYear();
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${nextNumber}`;
};

export const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
};

export const calculateBalance = (totalAmount, paidAmount) => {
  return totalAmount - paidAmount;
};

export const getQuotationValidUntil = async (quotationDate) => {
  const settings = await getGeneralSettings();
  const validDays = settings?.quotationValidDays || 30;
  const date = new Date(quotationDate);
  date.setDate(date.getDate() + validDays);
  return date;
};

export default {
  formatDate,
  formatDateTime,
  formatCurrency,
  getDateRange,
  filterByDateRange,
  generateQuotationNumber,
  generateInvoiceNumber,
  generateBoqNumber,
  calculateTotal,
  calculateBalance,
  getQuotationValidUntil,
  applyTaxCalculations,
  getOrgProfile,
  getTaxSettings,
  getGeneralSettings,
  clearSettingsCache,
};
