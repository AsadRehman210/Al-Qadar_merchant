import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { encryptTransform } from "redux-persist-transform-encrypt";
import { STORE_KEY } from "global/config";

// Import your slices
import authSlice from "./slices/authSlice";
import uniqueSlice from "./slices/uniqueSlice";
import headerSlice from "./slices/headerSlice";
import companySlice from "./slices/companySlice";
import customerSlice from "./slices/customerSlice";
import staffSlice from "./slices/staffSlice";
import appointmentSlice from "./slices/appointmentSlice";
import dashboardSlice from "./slices/dashboardSlice";
import employeeSlice from "./slices/employeeSlice";
import attendanceSlice from "./slices/attendanceSlice";
import salarySlice from "./slices/salarySlice";
import loanSlice from "./slices/loanSlice";
import expenseSlice from "./slices/expenseSlice";
import customerListSlice from "./slices/customerListSlice";
import leaveSlice from "./slices/leaveSlice";
import leaveTypeSlice from "./slices/leaveTypeSlice";
import payrollBatchSlice from "./slices/payrollBatchSlice";
import providentFundSlice from "./slices/providentFundSlice";
import requestSlice from "./slices/requestSlice";
import departmentSlice from "./slices/departmentSlice";
import designationSlice from "./slices/designationSlice";
import attendancePolicySlice from "./slices/attendancePolicySlice";
import holidaySlice from "./slices/holidaySlice";
import announcementSlice from "./slices/announcementSlice";
import recruitmentSlice from "./slices/recruitmentSlice";
import onboardingSlice from "./slices/onboardingSlice";
import offboardingSlice from "./slices/offboardingSlice";
import financeSlice from "./slices/financeSlice";
import assetSlice from "./slices/assetSlice";
import analyticsSlice from "./slices/analyticsSlice";
import categorySlice from "./slices/categorySlice";
import productSlice from "./slices/productSlice";
import variantSlice from "./slices/variantSlice";
import productionSlice from "./slices/productionSlice";
import stockSlice from "./slices/stockSlice";
import stockBatchSlice from "./slices/stockBatchSlice";
import warehouseSlice from "./slices/warehouseSlice";
import stockTransferSlice from "./slices/stockTransferSlice";
import stockIssueSlice from "./slices/stockIssueSlice";
import salesCustomerSlice from "./slices/salesCustomerSlice";
import supplierSlice from "./slices/supplierSlice";
import saleInvoiceSlice from "./slices/saleInvoiceSlice";
import quotationSlice from "./slices/quotationSlice";
import creditNoteSlice from "./slices/creditNoteSlice";
import purchaseInvoiceSlice from "./slices/purchaseInvoiceSlice";
import debitNoteSlice from "./slices/debitNoteSlice";
import geoSlice from "./slices/geoSlice";

// Create the encryptor using the correct import
const encryptor = encryptTransform({
  secretKey: STORE_KEY, // Change this to your own secret key
  onError: function (error) {
    console.error("Encryption error:", error); // Handle encryption errors
  },
});

// Persist configuration with encryption transform
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["unique"], // Only persist the 'unique' slice
  transforms: [encryptor], // Add the encryption transform here
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  unique: uniqueSlice,
  header: headerSlice,
  company: companySlice,
  customer: customerSlice,
  staff: staffSlice,
  appointment: appointmentSlice,
  dashboard: dashboardSlice,
  employee: employeeSlice,
  attendance: attendanceSlice,
  salary: salarySlice,
  loan: loanSlice,
  expense: expenseSlice,
  customerList: customerListSlice,
  leave: leaveSlice,
  leaveType: leaveTypeSlice,
  payrollBatch: payrollBatchSlice,
  providentFund: providentFundSlice,
  request: requestSlice,
  department: departmentSlice,
  designation: designationSlice,
  attendancePolicy: attendancePolicySlice,
  holiday: holidaySlice,
  announcement: announcementSlice,
  recruitment: recruitmentSlice,
  onboarding: onboardingSlice,
  offboarding: offboardingSlice,
  finance: financeSlice,
  asset: assetSlice,
  analytics: analyticsSlice,
  category: categorySlice,
  product: productSlice,
  variant: variantSlice,
  production: productionSlice,
  stock: stockSlice,
  stockBatch: stockBatchSlice,
  warehouse: warehouseSlice,
  stockTransfer: stockTransferSlice,
  stockIssue: stockIssueSlice,
  salesCustomer: salesCustomerSlice,
  supplier: supplierSlice,
  saleInvoice: saleInvoiceSlice,
  quotation: quotationSlice,
  creditNote: creditNoteSlice,
  purchaseInvoice: purchaseInvoiceSlice,
  debitNote: debitNoteSlice,
  geo: geoSlice,
});

// Wrap rootReducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable checks for redux-persist
    }),
});

// Create the persistor
const persistor = persistStore(store);

export { store, persistor };
