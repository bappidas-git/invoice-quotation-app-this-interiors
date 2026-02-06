export const QUOTATION_STATUS = {
  QUOTATION: "Performa",
  PARTIALLY_PAID: "Partially Paid",
  FULLY_PAID: "Fully Paid",
};

export const INVOICE_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Credit Card",
  "Debit Card",
  "Cheque",
  "Online Payment",
];

// This will be overridden by general settings
export const CURRENCY = "AED";

export const DATE_FORMAT = "dd/MM/yyyy";

export default {
  QUOTATION_STATUS,
  INVOICE_STATUS,
  PAYMENT_METHODS,
  CURRENCY,
  DATE_FORMAT,
};
