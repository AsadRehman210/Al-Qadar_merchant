import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en.json";
import translationAR from "./locales/ar.json";
import customersEN from "./locales/en/customers.json";
import customersAR from "./locales/ar/customers.json";
import assetSelectionEN from "./locales/en/assetSelection.json";
import assetSelectionAR from "./locales/ar/assetSelection.json";
import documentsEN from "./locales/en/documents.json";
import documentsAR from "./locales/ar/documents.json";
import dashboardEN from "./locales/en/dashboard.json";
import dashboardAR from "./locales/ar/dashboard.json";
import employeesEN from "./locales/en/employees.json";
import employeesAR from "./locales/ar/employees.json";
import attendanceEN from "./locales/en/attendance.json";
import attendanceAR from "./locales/ar/attendance.json";
import salaryEN from "./locales/en/salary.json";
import salaryAR from "./locales/ar/salary.json";
import loansEN from "./locales/en/loans.json";
import loansAR from "./locales/ar/loans.json";
import expensesEN from "./locales/en/expenses.json";
import expensesAR from "./locales/ar/expenses.json";
import suppliersEN from "./locales/en/suppliers.json";
import suppliersAR from "./locales/ar/suppliers.json";
import salesEN from "./locales/en/sales.json";
import salesAR from "./locales/ar/sales.json";
import purchaseEN from "./locales/en/purchase.json";
import purchaseAR from "./locales/ar/purchase.json";
import departmentEN from "./locales/en/department.json";
import departmentAR from "./locales/ar/department.json";
import productEN from "./locales/en/product.json";
import productAR from "./locales/ar/product.json";
import productionEN from "./locales/en/production.json";
import productionAR from "./locales/ar/production.json";
import assetEN from "./locales/en/asset.json";
import assetAR from "./locales/ar/asset.json";
import financeEN from "./locales/en/finance.json";
import financeAR from "./locales/ar/finance.json";
import leaveEN from "./locales/en/leave.json";
import leaveAR from "./locales/ar/leave.json";
import payrollBatchEN from "./locales/en/payrollBatch.json";
import payrollBatchAR from "./locales/ar/payrollBatch.json";
import providentFundEN from "./locales/en/providentFund.json";
import providentFundAR from "./locales/ar/providentFund.json";
import designationEN from "./locales/en/designation.json";
import designationAR from "./locales/ar/designation.json";
import adminEN from "./locales/en/admin.json";
import adminAR from "./locales/ar/admin.json";
import merchantEN from "./locales/en/merchant.json";
import merchantAR from "./locales/ar/merchant.json";
import warehouseEN from "./locales/en/warehouse.json";
import warehouseAR from "./locales/ar/warehouse.json";
import requestsEN from "./locales/en/requests.json";
import requestsAR from "./locales/ar/requests.json";
import hrhubEN from "./locales/en/hrhub.json";
import hrhubAR from "./locales/ar/hrhub.json";
import offboardingEN from "./locales/en/offboarding.json";
import offboardingAR from "./locales/ar/offboarding.json";
import orgHrEN from "./locales/en/orgHr.json";
import orgHrAR from "./locales/ar/orgHr.json";
import performanceEN from "./locales/en/performance.json";
import performanceAR from "./locales/ar/performance.json";

const resources = {
  en: {
    translation: translationEN,
    customers: customersEN,
    assetSelection: assetSelectionEN,
    documents: documentsEN,
    dashboard: dashboardEN,
    employees: employeesEN,
    attendance: attendanceEN,
    salary: salaryEN,
    loans: loansEN,
    expenses: expensesEN,
    suppliers: suppliersEN,
    sales: salesEN,
    purchase: purchaseEN,
    department: departmentEN,
    product: productEN,
    production: productionEN,
    asset: assetEN,
    finance: financeEN,
    leave: leaveEN,
    payroll: payrollBatchEN,
    pf: providentFundEN,
    designation: designationEN,
    admin: adminEN,
    merchant: merchantEN,
    warehouse: warehouseEN,
    requests: requestsEN,
    hrhub: hrhubEN,
    offboarding: offboardingEN,
    orgHr: orgHrEN,
    performance: performanceEN,
  },
  ar: {
    translation: translationAR,
    customers: customersAR,
    assetSelection: assetSelectionAR,
    documents: documentsAR,
    dashboard: dashboardAR,
    employees: employeesAR,
    attendance: attendanceAR,
    salary: salaryAR,
    loans: loansAR,
    expenses: expensesAR,
    suppliers: suppliersAR,
    sales: salesAR,
    purchase: purchaseAR,
    department: departmentAR,
    product: productAR,
    production: productionAR,
    asset: assetAR,
    finance: financeAR,
    leave: leaveAR,
    payroll: payrollBatchAR,
    pf: providentFundAR,
    designation: designationAR,
    admin: adminAR,
    merchant: merchantAR,
    warehouse: warehouseAR,
    requests: requestsAR,
    hrhub: hrhubAR,
    offboarding: offboardingAR,
    orgHr: orgHrAR,
    performance: performanceAR,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  ns: [
    "translation",
    "customers",
    "assetSelection",
    "documents",
    "dashboard",
    "employees",
    "attendance",
    "salary",
    "loans",
    "expenses",
    "suppliers",
    "sales",
    "purchase",
    "department",
    "product",
    "production",
    "asset",
    "finance",
    "leave",
    "payroll",
    "pf",
    "designation",
    "admin",
    "merchant",
    "warehouse",
    "requests",
    "hrhub",
    "offboarding",
    "orgHr",
    "performance",
  ],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  transSupportBasicHtmlNodes: true,
});

export default i18n;
