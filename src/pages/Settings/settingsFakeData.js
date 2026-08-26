// Settings fake data — mutable in-memory store
let _settings = {
  company: {
    name:        "Rafeeqi Enterprise",
    legalName:   "Rafeeqi Enterprise Co. Ltd.",
    logo:        "",
    email:       "info@rafeeqi.com",
    phone:       "+966 11 XXX XXXX",
    website:     "https://rafeeqi.com",
    address:     "King Fahd Road, Riyadh 11461, Saudi Arabia",
    taxNumber:   "300XXXXXXXXX",
    crNumber:    "1010XXXXXX",
    country:     "Saudi Arabia",
    city:        "Riyadh",
    currency:    "SAR",
  },
  financial: {
    fiscalYearStart:  "01-01",
    fiscalYearEnd:    "12-31",
    defaultCurrency:  "SAR",
    decimalPlaces:    2,
    dateFormat:       "DD/MM/YYYY",
    autoJournalEntry: true,
    vatRegistered:    true,
    vatNumber:        "300XXXXXXXXX",
  },
  taxRates: [
    { id: "tax1", name: "Standard VAT",   rate: 15,  type: "VAT",        status: "Active",   isDefault: true  },
    { id: "tax2", name: "Zero Rated",     rate: 0,   type: "VAT",        status: "Active",   isDefault: false },
    { id: "tax3", name: "Exempt",         rate: 0,   type: "Exempt",     status: "Active",   isDefault: false },
    { id: "tax4", name: "WHT — Services", rate: 5,   type: "Withholding",status: "Active",   isDefault: false },
    { id: "tax5", name: "Import Duty",    rate: 5,   type: "Customs",    status: "Inactive", isDefault: false },
  ],
  notifications: {
    emailAlerts:       true,
    lowStockAlert:     true,
    paymentDueAlert:   true,
    leaveApproval:     true,
    payrollReminder:   true,
    assetWarranty:     true,
    budgetOverrun:     true,
    alertEmail:        "alerts@rafeeqi.com",
  },
  system: {
    language:    "en",
    timezone:    "Asia/Riyadh",
    dateFormat:  "DD/MM/YYYY",
    timeFormat:  "12h",
    theme:       "light",
    maintenanceMode: false,
  },
};

export const getSettings    = ()         => JSON.parse(JSON.stringify(_settings));
export const getCompany     = ()         => ({ ..._settings.company });
export const getFinancial   = ()         => ({ ..._settings.financial });
export const getTaxRates    = ()         => [..._settings.taxRates];
export const getNotifications = ()       => ({ ..._settings.notifications });
export const getSystemSettings = ()      => ({ ..._settings.system });

export function saveCompany(data)        { _settings.company     = { ..._settings.company,     ...data }; }
export function saveFinancial(data)      { _settings.financial   = { ..._settings.financial,   ...data }; }
export function saveNotifications(data)  { _settings.notifications = { ..._settings.notifications, ...data }; }
export function saveSystem(data)         { _settings.system      = { ..._settings.system,      ...data }; }

export function addTaxRate(data) {
  const entry = { ...data, id: `tax-${Date.now()}` };
  _settings.taxRates = [..._settings.taxRates, entry];
  return entry;
}
export function updateTaxRate(id, data) {
  _settings.taxRates = _settings.taxRates.map((t) => t.id === id ? { ...t, ...data } : t);
}
export function deleteTaxRate(id) {
  _settings.taxRates = _settings.taxRates.filter((t) => t.id !== id);
}

export const TAX_TYPE_OPTS = [
  { id: "VAT",         title: "VAT" },
  { id: "Withholding", title: "Withholding Tax" },
  { id: "Customs",     title: "Customs / Import Duty" },
  { id: "Exempt",      title: "Exempt" },
];

export const CURRENCY_OPTS = [
  { id: "SAR", title: "SAR — Saudi Riyal" },
  { id: "USD", title: "USD — US Dollar" },
  { id: "EUR", title: "EUR — Euro" },
  { id: "AED", title: "AED — UAE Dirham" },
  { id: "GBP", title: "GBP — British Pound" },
  { id: "EGP", title: "EGP — Egyptian Pound" },
  { id: "KWD", title: "KWD — Kuwaiti Dinar" },
];

export const DATE_FORMAT_OPTS = [
  { id: "DD/MM/YYYY", title: "DD/MM/YYYY" },
  { id: "MM/DD/YYYY", title: "MM/DD/YYYY" },
  { id: "YYYY-MM-DD", title: "YYYY-MM-DD" },
];

export const TIMEZONE_OPTS = [
  { id: "Asia/Riyadh",  title: "Asia/Riyadh (UTC+3)" },
  { id: "Asia/Dubai",   title: "Asia/Dubai (UTC+4)" },
  { id: "Asia/Amman",   title: "Asia/Amman (UTC+2)" },
  { id: "Europe/London",title: "Europe/London (UTC+0)" },
  { id: "UTC",          title: "UTC" },
];
