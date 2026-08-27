// Importing env variables for consistency
import i18n from "i18next";

export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
export const BASE_URL = `${import.meta.env.VITE_APP_BASE_URL}/rafeeqi`;

// The real ERP backend (D:/start/backend) — a separate, unrelated service
// from the legacy BASE_URL above. Mounted at /api in app.ts.
export const ERP_BASE_URL = `${import.meta.env.VITE_ERP_BASE_URL}/api`;

// Endpoint map for the ERP backend, kept separate from the legacy `urls`
// object below so the two unrelated backends' paths never get confused.
export const erpUrls = {
  login: "/auth/login",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  verifyOtp: "/auth/verify-otp",
  resetPassword: "/auth/reset-password",

  departments: "/department",
  designations: "/designation",
  employees: "/employee",

  attendancePolicies: "/attendance-policy",
  attendance: "/attendance",

  salaries: "/salary",
  loans: "/loan",
  expenses: "/expense",

  pfPolicy: "/pf-policy",
  pfAccount: "/pf-account",
  pfContribution: "/pf-contribution",
  pfWithdrawal: "/pf-withdrawal",

  leaveTypes: "/leave-type",
  leaves: "/leave",

  payrollRuns: "/payroll-run",
  specialPaymentTypes: "/special-payment-type",
  specialPayments: "/special-payment",

  employeeRequests: "/employee-request",
  holidays: "/holiday",
  announcements: "/announcement",

  jobs: "/recruitment/job",
  candidates: "/recruitment/candidate",
  onboardingTemplates: "/onboarding-template",
  onboardings: "/onboarding",
  exits: "/offboarding",

  merchants: "/merchant",

  chartOfAccounts: "/finance/chart-of-account",
  journalEntries: "/finance/journal",
  ledger: "/finance/ledger",
  financeReports: "/finance/reports",
  bankAccounts: "/finance/bank-account",
  vendorBills: "/finance/vendor-bill",
  customerInvoices: "/finance/customer-invoice",
  payments: "/finance/payment",
  incomeEntries: "/finance/income-entry",
  businessExpenses: "/finance/business-expense",
  bankStatementLines: "/finance/bank-statement-line",
  reconciliationSessions: "/finance/reconciliation-session",
  budgets: "/finance/budget",

  assetCategories: "/asset-category",
  assets: "/asset",
  assetRequests: "/asset-request",
  assetAudits: "/asset-audit",

  hrAnalytics: "/analytics/hr",
  inventoryAnalytics: "/analytics/inventory",
  salesAnalytics: "/analytics/sales",

  categories: "/inventory/category",
  products: "/inventory/product",
  variants: "/inventory/variant",
  production: "/inventory/production",
  stock: "/inventory/stock",
  stockBatches: "/inventory/stock-batch",

  warehouses: "/warehouse/warehouse",
  stockTransfers: "/warehouse/stock-transfer",
  stockIssues: "/warehouse/stock-issue",

  customers: "/sales/customer",
  saleInvoices: "/sales/sale-invoice",
  quotations: "/sales/quotation",
  creditNotes: "/sales/credit-note",

  suppliers: "/purchase/supplier",
  purchaseInvoices: "/purchase/purchase-invoice",
  debitNotes: "/purchase/debit-note",

  countries: "/geo/countries",
  currencies: "/geo/currencies",
};
export const SOCKET_URL = import.meta.env.VITE_APP_BASE_URL;
export const BANK_KEY = import.meta.env.VITE_APP_BANK_KEY;
export const STORE_KEY = import.meta.env.VITE_APP_STORE_KEY;
export const PROD_KEY = import.meta.env.VITE_PRODUCTION;
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
export const APP_VERSION = "1.0.2";

// Add urls for apis globally
export const urls = {
  login: "/api/user/login-admin",
  logout: "/api/user/logout-admin",
  update_profile: "/api/agency/update",
  get_user_info: "/api/employee/get-user-info-admin",
  verify_otp: "/api/user/verify-otp",
  forget_password: "/api/user/forgot-password",
  reset_password: "/api/user/update-password",
  generate_otp: "/api/user/generate-otp",

  get_vehicle: "/api/vehicle/get",
  get_all_vehicle: "/api/vehicle/get-all",
  lookup: "/api/lookup/get-all",
  lookup_post: "/api/lookup/post",
  lookup_delete: "/api/lookup/delete",
  lookup_get: "/api/lookup/get",
  country: "/api/country/get-all",
  city: "/api/city/get-all",
  currency: "/api/country/get-all-currency",
  get_all_company: "/api/company/get-all",
  get_company: "/api/company/get",
  add_company: "/api/company/post",
  delete_company: "/api/company/delete",
  get_billing: "/api/payment/get",
  add_billing: "/api/payment/post",
  get_all_customer: "/api/customer/get-all",
  get_all_admin_customer: "/api/customer/get-all-customer-admin",
  dropdwon_customer_get_all: "/api/customer/get-all-dropdown",
  dropdwon_customerAgency_get_all: "/api/agency-customer/get-all-dropdown",
  get_customer: "/api/customer/get",
  add_customer: "/api/customer/post",
  delete_customer: "/api/customer/delete",
  delete_customer_for_agency: "/api/agency-customer/delete-customer-for-agency",
  get_existing_customer: "/api/customer/get-by-email",
  get_all_driver: "/api/employee/get-all",

  // Chat endpoints
  create_chat: "/api/chat-node/create-chat",
  chat_get_all: "/api/chat-node/get-all",
  get_chat_messages: "/api/chat-node-message/get-all",
  send_chat_message: "/api/chat/send-message",
  mark_message_read: "/api/chat-node-message/read-message",
  delete_message: "/api/chat-node-message/delete",
  post_message_file: "/api/chat-node-message/post-message-file",
  user_info: "/auth/api/user/get-shop-user-info",
  state: "/fueling/api/state/get-all",
  banks: "/payment/api/bank-data/get-all",
  get_all_notification: "/api/notification/get-all",
  mark_as_read: "/api/notification/mark-read",
  get_branding: "/api/organization/get-branding",
  get_calendar_booking: "/api/booking/get-booking-calender",
  post_mark_all_read_notification: "/api/notification/mark-all-read",
  dashboard_analytics: "/api/admin/dashboard-analytics",
  dashboard_analytics_by_date: "/api/admin/dashboard-analytics-by-date",
};

export const PHONE_EMAIL_EXIST = "This phone number or email already exist.";
export const ENTER_OTP = "Please enter the OTP sent to this email.";
export const CUSTOMER_NOT_EXIST =
  "This email does not exist in the system. You can proceed with this email.";

// Global status codes for apis response
export const SUCCESS = 200;
export const UPDATED = 204;
export const FAILED = 400;
export const EXIST = 409;
export const NOT_EXIST = 404;
export const EXCEPTION = 500;
export const UNAUTHORIZED = 401;
export const NO_ACCESS = 403;
export const TO0_MANY_CODE = 429;
export const TOO_MANY_REQUEST = "Request failed with status code 429";

export const NETWORK_ERROR =
  "Network error: Please check your internet connection.";
export const SESSION_ERROR =
  "Your session has expired. Please log in again to continue.";

export const REGISTER_EMAIL_CODE_MESSAGE =
  "Please enter the 6-digit code that has been sent to your email.";
