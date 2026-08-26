import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "components/ErrorPage";
import NotFound from "components/NotFound";
import LoaderContainer from "components/LoaderContainer";
import LayoutDashboard from "layout/LayoutDashboard";
import LayoutStatic from "layout/LayoutStatic";
import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "react-toastify/dist/ReactToastify.css";

import { setupInterceptors } from "api";
import { setupErpInterceptors } from "api/erpClient";
import ToastWrapper from "./components/ToastWrapper";
import { useDispatch, useSelector } from "react-redux";
import { showToken, showUserData } from "store/slices/uniqueSlice";
import { generateColorRamp, DEFAULT_THEME_COLOR } from "global/colorRamp";
import { updateNavigation } from "store/slices/authSlice";
const Login = lazy(() => import("pages/Auth/Login"));
const ForgetPassword = lazy(() => import("pages/Auth/ForgetPassword"));
const Dashboard = lazy(() => import("pages/Dashboard"));
const Customers = lazy(() => import("pages/Customers"));
const Employees = lazy(() => import("pages/Employees"));
const AddEmployees = lazy(() => import("pages/Employees/AddEmployees"));
const EmployeeDetail = lazy(() => import("pages/Employees/EmployeeDetail"));
const OrgChart = lazy(() => import("pages/OrgChart"));
const Compliance = lazy(() => import("pages/Compliance"));
const Attendance = lazy(() => import("pages/Attendance"));
const AddAttendance = lazy(() => import("pages/Attendance/AddAttendance"));
const AttendancePolicy = lazy(
  () => import("pages/Attendance/AttendancePolicy"),
);
const AddAttendancePolicy = lazy(
  () => import("pages/Attendance/AttendancePolicy/AddAttendancePolicy"),
);
const AttendancePolicyDetail = lazy(
  () => import("pages/Attendance/AttendancePolicy/AttendancePolicyDetail"),
);
const AttendanceDetail = lazy(
  () => import("pages/Attendance/AttendanceDetail"),
);
const Shifts = lazy(() => import("pages/Shifts"));
const Salary = lazy(() => import("pages/Salary"));
const Loans = lazy(() => import("pages/Loans"));
const AddLoan = lazy(() => import("pages/Loans/AddLoan"));
const LoanDetail = lazy(() => import("pages/Loans/LoanDetail"));
const LeaveManagement = lazy(() => import("pages/LeaveManagement"));
const ApplyLeave = lazy(() => import("pages/LeaveManagement/ApplyLeave"));
const AddLeave = lazy(() => import("pages/LeaveManagement/AddLeave"));
const LeaveDetail = lazy(() => import("pages/LeaveManagement/LeaveDetail"));
const ManagerApprovals = lazy(() => import("pages/LeaveManagement/ManagerApprovals"));
const HrApprovals = lazy(() => import("pages/LeaveManagement/HrApprovals"));
const LeaveTypes = lazy(() => import("pages/LeaveManagement/LeaveTypes"));
const LeaveBalances = lazy(() => import("pages/LeaveManagement/LeaveBalances"));
const Requests = lazy(() => import("pages/Requests"));
const ApplyRequest = lazy(() => import("pages/Requests/ApplyRequest"));
const RequestDetail = lazy(() => import("pages/Requests/RequestDetail"));
const RequestApprovals = lazy(() => import("pages/Requests/Approvals"));
const MyApprovals = lazy(() => import("pages/Requests/MyApprovals")); // unified approvals inbox
const HolidayCalendar = lazy(() => import("pages/HolidayCalendar"));
const Announcements = lazy(() => import("pages/Announcements"));
const Onboarding = lazy(() => import("pages/Onboarding"));
const OnboardingTaskTemplates = lazy(() => import("pages/Onboarding/TaskTemplates"));
const Offboarding = lazy(() => import("pages/Offboarding"));
const InitiateExit = lazy(() => import("pages/Offboarding/InitiateExit"));
const ExitDetail = lazy(() => import("pages/Offboarding/ExitDetail"));
const PayrollBatch = lazy(() => import("pages/PayrollBatch"));
const CreateRun = lazy(() => import("pages/PayrollBatch/CreateRun"));
const RunDetail = lazy(() => import("pages/PayrollBatch/RunDetail"));
const Payslip = lazy(() => import("pages/PayrollBatch/Payslip"));
const ProvidentFund = lazy(() => import("pages/ProvidentFund"));
const PFDetail = lazy(() => import("pages/ProvidentFund/PFDetail"));
const PFPolicy = lazy(() => import("pages/ProvidentFund/PFPolicy"));
const SpecialPayments = lazy(() => import("pages/SpecialPayments"));
const CreateSpecialPayment = lazy(() => import("pages/SpecialPayments/CreateSpecialPayment"));
const SPDetail = lazy(() => import("pages/SpecialPayments/SPDetail"));
const PaymentTypes = lazy(() => import("pages/SpecialPayments/PaymentTypes"));
const Expenses = lazy(() => import("pages/Expenses"));
const AddExpense = lazy(() => import("pages/Expenses/AddExpense"));
const ExpenseDetail = lazy(() => import("pages/Expenses/ExpenseDetail"));
const Departments = lazy(() => import("pages/Departments"));
const AddDepartment = lazy(() => import("pages/Departments/AddDepartment"));
const DepartmentDetail = lazy(
  () => import("pages/Departments/DepartmentDetail"),
);
const AddCustomer = lazy(() => import("pages/Customers/AddCustomer"));
const CustomerDetail = lazy(() => import("pages/Customers/CustomerDetail"));
const Suppliers = lazy(() => import("pages/Suppliers"));
const AddSupplier = lazy(() => import("pages/Suppliers/AddSupplier"));
const SupplierDetail = lazy(() => import("pages/Suppliers/SupplierDetail"));
const Sales = lazy(() => import("pages/Sales"));
const AddSaleInvoice = lazy(() => import("pages/Sales/AddSaleInvoice"));
const SaleDetail = lazy(() => import("pages/Sales/SaleDetail"));
const Purchases = lazy(() => import("pages/Purchases"));
const AddPurchaseInvoice = lazy(
  () => import("pages/Purchases/AddPurchaseInvoice"),
);
const PurchaseDetail = lazy(() => import("pages/Purchases/PurchaseDetail"));
const Products = lazy(() => import("pages/Inventory/Products"));
const AddProduct = lazy(() => import("pages/Inventory/Products/AddProduct"));
const ProductDetail = lazy(
  () => import("pages/Inventory/Products/ProductDetail"),
);
const ImportProducts = lazy(
  () => import("pages/Inventory/Products/ImportProducts"),
);
const ProductCategories = lazy(() => import("pages/Inventory/Categories"));
const AddCategory = lazy(
  () => import("pages/Inventory/Categories/AddCategory"),
);
const CategoryDetail = lazy(
  () => import("pages/Inventory/Categories/CategoryDetail"),
);
const ProductVariants = lazy(() => import("pages/Inventory/Variants"));
const AddVariant = lazy(() => import("pages/Inventory/Variants/AddVariant"));
const VariantDetail = lazy(
  () => import("pages/Inventory/Variants/VariantDetail"),
);
const InventoryStock = lazy(() => import("pages/Inventory/Stock"));
const StockDetail = lazy(() => import("pages/Inventory/Stock/StockDetail"));
const Production = lazy(() => import("pages/Inventory/Production"));
const AddProductionOrder = lazy(
  () => import("pages/Inventory/Production/AddProductionOrder"),
);
const ProductionDetail = lazy(
  () => import("pages/Inventory/Production/ProductionDetail"),
);
const AssetRegister = lazy(() => import("pages/Assets"));
const AddAsset = lazy(() => import("pages/Assets/AddAsset"));
const AssetDetail = lazy(() => import("pages/Assets/AssetDetail"));
const AssetCategories = lazy(() => import("pages/Assets/Categories"));
const AddAssetCategory = lazy(
  () => import("pages/Assets/Categories/AddCategory"),
);
const AssetCategoryDetail = lazy(
  () => import("pages/Assets/Categories/CategoryDetail"),
);
const AssetReports = lazy(() => import("pages/Assets/Reports"));
const ImportAssets = lazy(() => import("pages/Assets/ImportAssets"));
const AssetRequests = lazy(() => import("pages/Assets/Requests"));
const AssetAudits = lazy(() => import("pages/Assets/Audits"));
const ChartOfAccounts = lazy(() => import("pages/Finance/ChartOfAccounts"));
const AddCOAAccount = lazy(
  () => import("pages/Finance/ChartOfAccounts/AddAccount"),
);
const FinanceLedger = lazy(() => import("pages/Finance/Ledger"));
const JournalEntries = lazy(() => import("pages/Finance/JournalEntries"));
const AddJournal = lazy(
  () => import("pages/Finance/JournalEntries/AddJournal"),
);
const FinanceReceivable = lazy(() => import("pages/Finance/Receivable"));
const FinancePayable = lazy(() => import("pages/Finance/Payable"));
const AddBill = lazy(() => import("pages/Finance/Payable/AddBill"));
const BillDetail = lazy(() => import("pages/Finance/Payable/BillDetail"));
const FinanceExpenses = lazy(() => import("pages/Finance/Expenses"));
const AddFinanceExpense = lazy(
  () => import("pages/Finance/Expenses/AddExpense"),
);
const FinanceIncome = lazy(() => import("pages/Finance/Income"));
const AddFinanceIncome = lazy(() => import("pages/Finance/Income/AddIncome"));
const FinanceInvoices = lazy(() => import("pages/Finance/FinanceInvoices"));
const AddInvoice = lazy(() => import("pages/Finance/FinanceInvoices/AddInvoice"));
const InvoiceDetail = lazy(
  () => import("pages/Finance/FinanceInvoices/InvoiceDetail"),
);
const FinancePayments = lazy(() => import("pages/Finance/Payments"));
const AddFinancePayment = lazy(
  () => import("pages/Finance/Payments/AddPayment"),
);
const BankCash = lazy(() => import("pages/Finance/BankCash"));
const AddBankAccount = lazy(
  () => import("pages/Finance/BankCash/AddBankAccount"),
);
const BankAccountDetail = lazy(
  () => import("pages/Finance/BankCash/BankAccountDetail"),
);
const AddBankEntry = lazy(() => import("pages/Finance/BankCash/AddBankEntry"));
const FinancialReports = lazy(() => import("pages/Finance/FinancialReports"));
const BankReconciliation = lazy(() => import("pages/Finance/BankReconciliation"));
const VatManagement = lazy(() => import("pages/Finance/VatManagement"));
const Warehouse = lazy(() => import("pages/Warehouse"));
const AddWarehouse = lazy(() => import("pages/Warehouse/AddWarehouse"));
const WarehouseDetail = lazy(() => import("pages/Warehouse/WarehouseDetail"));
const StockTransfer = lazy(() => import("pages/Warehouse/StockTransfer"));
const StockIssue = lazy(() => import("pages/Warehouse/StockIssue"));
const Settings = lazy(() => import("pages/Settings"));
const Performance = lazy(() => import("pages/Performance"));
const AddAppraisal = lazy(() => import("pages/Performance/AddAppraisal"));
const AppraisalDetail = lazy(() => import("pages/Performance/AppraisalDetail"));
const Recruitment = lazy(() => import("pages/Recruitment"));
const AddJob = lazy(() => import("pages/Recruitment/AddJob"));
const JobDetail = lazy(() => import("pages/Recruitment/JobDetail"));
const Reports = lazy(() => import("pages/Reports"));
const Designations = lazy(() => import("pages/Designations"));
const AddDesignation = lazy(() => import("pages/Designations/AddDesignation"));
const DesignationDetail = lazy(() => import("pages/Designations/DesignationDetail"));
const AllNotifications = lazy(
  () => import("pages/Notifications/AllNotifications"),
);
const SalesQuotations = lazy(() => import("pages/Sales/Quotations"));
const AddSalesQuotation = lazy(() => import("pages/Sales/Quotations/AddQuotation"));
const SalesQuotationDetail = lazy(() => import("pages/Sales/Quotations/QuotationDetail"));
const CreditNotes = lazy(() => import("pages/Sales/CreditNotes"));
const AddCreditNote = lazy(() => import("pages/Sales/CreditNotes/AddCreditNote"));
const CreditNoteDetail = lazy(() => import("pages/Sales/CreditNotes/CreditNoteDetail"));
const DebitNotes = lazy(() => import("pages/Purchases/DebitNotes"));
const AddDebitNote = lazy(() => import("pages/Purchases/DebitNotes/AddDebitNote"));
const DebitNoteDetail = lazy(() => import("pages/Purchases/DebitNotes/DebitNoteDetail"));
const StockAdjust = lazy(() => import("pages/Inventory/Stock/StockAdjust"));

// Dashboard routes require a live ERP session — previously there was no
// guard at all, so any dashboard URL was reachable without logging in (the
// pages would just fail their API calls silently).
const RequireAuth = () => {
  const token = useSelector(showToken);
  return token ? <Outlet /> : <Navigate to="/" replace />;
};

function Router() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userData = useSelector(showUserData);

  // Tenant brand color — repaints every existing teal-* class in the app by
  // overriding the same CSS variables theme.css's own default ramp defines,
  // with inline styles (highest specificity) so this always wins. Backend
  // already resolves Merchant -> parent Admin -> platform default, so
  // userData.themeColor here is always a concrete hex once login/rehydrate
  // has happened; falls back to the same default the CSS ships with when it
  // hasn't (first paint, logged-out pages).
  useEffect(() => {
    const ramp = generateColorRamp(userData?.themeColor || DEFAULT_THEME_COLOR);
    const root = document.documentElement;
    Object.entries(ramp).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-teal-${shade}`, hex);
    });
  }, [userData?.themeColor]);

  useEffect(() => {
    // when reload setting pre selected theme and language
    const theme = localStorage.getItem("theme");
    const lng = localStorage.getItem("lng");
    if (lng == "ar") {
      document.body.dir = "rtl";
      i18n.changeLanguage(lng);
    }
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    // Setup interceptors and update state when done
    const initInterceptors = async () => {
      await setupInterceptors(navigate);
      setupErpInterceptors(navigate);
    };

    initInterceptors();
  }, [navigate]);

  const location = useLocation();
  useEffect(() => {
    dispatch(updateNavigation(location.pathname));
  }, [location, dispatch]);

  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <ToastWrapper />
        <Suspense fallback={<LoaderContainer />}>
          <Routes>
            <Route element={<LayoutStatic />}>
              <Route path="/" element={<Login />} />
              <Route path="/forget-password" element={<ForgetPassword />} />
            </Route>
            {/* react outlet component to set different layout for below routes */}
            <Route element={<RequireAuth />}>
            <Route element={<LayoutDashboard />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/add" element={<AddCustomer />} />
              <Route path="customers/edit/:id" element={<AddCustomer />} />
              <Route path="customers/detail/:id" element={<CustomerDetail />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/add" element={<AddSupplier />} />
              <Route path="suppliers/edit/:id" element={<AddSupplier />} />
              <Route path="suppliers/detail/:id" element={<SupplierDetail />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/add" element={<AddSaleInvoice />} />
              <Route path="sales/edit/:id" element={<AddSaleInvoice />} />
              <Route path="sales/detail/:id" element={<SaleDetail />} />
              <Route path="quotation" element={<SalesQuotations />} />
              <Route path="quotation/add" element={<AddSalesQuotation />} />
              <Route path="quotation/edit/:id" element={<AddSalesQuotation />} />
              <Route path="quotation/detail/:id" element={<SalesQuotationDetail />} />
              <Route path="credit-notes" element={<CreditNotes />} />
              <Route path="credit-notes/add" element={<AddCreditNote />} />
              <Route path="credit-notes/detail/:id" element={<CreditNoteDetail />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="purchases/add" element={<AddPurchaseInvoice />} />
              <Route path="purchases/edit/:id" element={<AddPurchaseInvoice />} />
              <Route path="purchases/detail/:id" element={<PurchaseDetail />} />
              <Route path="debit-notes" element={<DebitNotes />} />
              <Route path="debit-notes/add" element={<AddDebitNote />} />
              <Route path="debit-notes/detail/:id" element={<DebitNoteDetail />} />
              <Route path="inventory/products" element={<Products />} />
              <Route path="inventory/products/add" element={<AddProduct />} />
              <Route
                path="inventory/products/edit/:id"
                element={<AddProduct />}
              />
              <Route
                path="inventory/products/detail/:id"
                element={<ProductDetail />}
              />
              <Route path="inventory/products/import" element={<ImportProducts />} />
              <Route
                path="inventory/categories"
                element={<ProductCategories />}
              />
              <Route
                path="inventory/categories/add"
                element={<AddCategory />}
              />
              <Route
                path="inventory/categories/edit/:id"
                element={<AddCategory />}
              />
              <Route
                path="inventory/categories/detail/:id"
                element={<CategoryDetail />}
              />
              <Route path="inventory/variants" element={<ProductVariants />} />
              <Route path="inventory/variants/add" element={<AddVariant />} />
              <Route
                path="inventory/variants/edit/:id"
                element={<AddVariant />}
              />
              <Route
                path="inventory/variants/detail/:id"
                element={<VariantDetail />}
              />
              <Route path="inventory/stock" element={<InventoryStock />} />
              <Route path="inventory/stock/detail/:id" element={<StockDetail />} />
              <Route path="inventory/stock/adjust" element={<StockAdjust />} />
              <Route path="inventory/production" element={<Production />} />
              <Route
                path="inventory/production/add"
                element={<AddProductionOrder />}
              />
              <Route
                path="inventory/production/edit/:id"
                element={<AddProductionOrder />}
              />
              <Route
                path="inventory/production/detail/:id"
                element={<ProductionDetail />}
              />
              <Route path="assets" element={<AssetRegister />} />
              <Route path="assets/add" element={<AddAsset />} />
              <Route path="assets/edit/:id" element={<AddAsset />} />
              <Route path="assets/detail/:id" element={<AssetDetail />} />
              <Route path="assets/reports" element={<AssetReports />} />
              <Route path="assets/import" element={<ImportAssets />} />
              <Route path="assets/requests" element={<AssetRequests />} />
              <Route path="assets/audits" element={<AssetAudits />} />
              <Route path="assets-categories" element={<AssetCategories />} />
              <Route
                path="assets-categories/add"
                element={<AddAssetCategory />}
              />
              <Route
                path="assets-categories/edit/:id"
                element={<AddAssetCategory />}
              />
              <Route
                path="assets-categories/detail/:id"
                element={<AssetCategoryDetail />}
              />
              <Route path="finance/coa" element={<ChartOfAccounts />} />
              <Route path="finance/coa/add" element={<AddCOAAccount />} />
              <Route path="finance/coa/edit/:id" element={<AddCOAAccount />} />
              <Route path="finance/ledger" element={<FinanceLedger />} />
              <Route path="finance/journal" element={<JournalEntries />} />
              <Route path="finance/journal/add" element={<AddJournal />} />
              <Route path="finance/journal/edit/:id" element={<AddJournal />} />
              <Route
                path="finance/receivable"
                element={<FinanceReceivable />}
              />
              <Route path="finance/payable" element={<FinancePayable />} />
              <Route path="finance/payable/add" element={<AddBill />} />
              <Route path="finance/payable/edit/:id" element={<AddBill />} />
              <Route path="finance/payable/:id" element={<BillDetail />} />
              <Route path="finance/expenses" element={<FinanceExpenses />} />
              <Route
                path="finance/expenses/add"
                element={<AddFinanceExpense />}
              />
              <Route
                path="finance/expenses/edit/:id"
                element={<AddFinanceExpense />}
              />
              <Route path="finance/income" element={<FinanceIncome />} />
              <Route path="finance/income/add" element={<AddFinanceIncome />} />
              <Route
                path="finance/income/edit/:id"
                element={<AddFinanceIncome />}
              />
              <Route path="finance/invoices" element={<FinanceInvoices />} />
              <Route path="finance/invoices/add" element={<AddInvoice />} />
              <Route path="finance/invoices/edit/:id" element={<AddInvoice />} />
              <Route path="finance/invoices/:id" element={<InvoiceDetail />} />
              <Route path="finance/payments" element={<FinancePayments />} />
              <Route
                path="finance/payments/add"
                element={<AddFinancePayment />}
              />
              <Route
                path="finance/payments/edit/:id"
                element={<AddFinancePayment />}
              />
              <Route
                path="finance/bank-cash/account/:accountId/entry/add"
                element={<AddBankEntry />}
              />
              <Route
                path="finance/bank-cash/account/:accountId/entry/edit/:entryId"
                element={<AddBankEntry />}
              />
              <Route
                path="finance/bank-cash/account/:accountId"
                element={<BankAccountDetail />}
              />
              <Route path="finance/bank-cash" element={<BankCash />} />
              <Route
                path="finance/bank-cash/add"
                element={<AddBankAccount />}
              />
              <Route
                path="finance/bank-cash/edit/:id"
                element={<AddBankAccount />}
              />
              <Route path="finance/reports" element={<FinancialReports />} />
              <Route path="finance/bank-reconciliation" element={<BankReconciliation />} />
              <Route path="finance/vat" element={<VatManagement />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="warehouse/add" element={<AddWarehouse />} />
              <Route path="warehouse/edit/:id" element={<AddWarehouse />} />
              <Route path="warehouse/detail/:id" element={<WarehouseDetail />} />
              <Route path="warehouse_transfers" element={<StockTransfer />} />
              <Route path="warehouse_transfers/add" element={<StockTransfer />} />
              <Route path="warehouse_issues" element={<StockIssue />} />
              <Route path="warehouse_issues/add" element={<StockIssue />} />
              <Route path="settings" element={<Settings />} />
              <Route path="performance" element={<Performance />} />
              <Route path="performance/add" element={<AddAppraisal />} />
              <Route path="performance/edit/:id" element={<AddAppraisal />} />
              <Route path="performance/detail/:id" element={<AppraisalDetail />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="recruitment/add" element={<AddJob />} />
              <Route path="recruitment/edit/:id" element={<AddJob />} />
              <Route path="recruitment/detail/:id" element={<JobDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="designations" element={<Designations />} />
              <Route path="designations/add" element={<AddDesignation />} />
              <Route path="designations/edit/:id" element={<AddDesignation />} />
              <Route path="designations/detail/:id" element={<DesignationDetail />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/add" element={<AddEmployees />} />
              <Route path="employees/edit/:id" element={<AddEmployees />} />
              <Route
                path="employees/details/:id"
                element={<EmployeeDetail />}
              />
              <Route path="org-chart" element={<OrgChart />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="departments" element={<Departments />} />
              <Route path="departments/add" element={<AddDepartment />} />
              <Route path="departments/edit/:id" element={<AddDepartment />} />
              <Route
                path="departments/details/:id"
                element={<DepartmentDetail />}
              />
              <Route path="attendance" element={<Attendance />} />
              <Route path="attendance/add" element={<AddAttendance />} />
              <Route
                path="attendance-policy"
                element={<AttendancePolicy />}
              />
              <Route
                path="attendance-policy/add"
                element={<AddAttendancePolicy />}
              />
              <Route
                path="attendance-policy/edit/:id"
                element={<AddAttendancePolicy />}
              />
              <Route
                path="attendance-policy/detail/:id"
                element={<AttendancePolicyDetail />}
              />
              <Route
                path="attendance/details/:employeeId"
                element={<AttendanceDetail />}
              />
              <Route path="shifts" element={<Shifts />} />
              <Route path="salary" element={<Salary />} />
              <Route path="loans" element={<Loans />} />
              <Route path="loans/add" element={<AddLoan />} />
              <Route path="loans/apply" element={<AddLoan selfService />} />
              <Route path="loans/edit/:id" element={<AddLoan />} />
              <Route path="loans/details/:id" element={<LoanDetail />} />
              <Route path="leave-management" element={<LeaveManagement />} />
              <Route path="leave-management/apply" element={<ApplyLeave />} />
              <Route path="leave-management/add" element={<AddLeave />} />
              <Route path="leave-management/details/:id" element={<LeaveDetail />} />
              <Route path="leave-management/manager-approvals" element={<ManagerApprovals />} />
              <Route path="leave-management/hr-approvals" element={<HrApprovals />} />
              <Route path="leave-management/leave-types" element={<LeaveTypes />} />
              <Route path="leave-management/balances" element={<LeaveBalances />} />
              <Route path="requests" element={<Requests />} />
              <Route path="requests/apply" element={<ApplyRequest />} />
              <Route path="requests/add" element={<ApplyRequest hrMode />} />
              <Route path="requests/details/:id" element={<RequestDetail />} />
              <Route path="requests/manager-approvals" element={<RequestApprovals stage="manager" />} />
              <Route path="requests/hr-approvals" element={<RequestApprovals stage="hr" />} />
              <Route path="my-approvals" element={<MyApprovals />} />
              <Route path="holiday-calendar" element={<HolidayCalendar />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="onboarding/templates" element={<OnboardingTaskTemplates />} />
              <Route path="offboarding" element={<Offboarding />} />
              <Route path="offboarding/add" element={<InitiateExit />} />
              <Route path="offboarding/detail/:id" element={<ExitDetail />} />
              <Route path="payroll-batch" element={<PayrollBatch />} />
              <Route path="payroll-batch/create" element={<CreateRun />} />
              <Route path="payroll-batch/details/:id" element={<RunDetail />} />
              <Route path="payroll-batch/payslip/:runId/:empId" element={<Payslip />} />
              <Route path="provident-fund" element={<ProvidentFund />} />
              <Route path="provident-fund/details/:empId" element={<PFDetail />} />
              <Route path="provident-fund/policy" element={<PFPolicy />} />
              <Route path="special-payments" element={<SpecialPayments />} />
              <Route path="special-payments/create" element={<CreateSpecialPayment />} />
              <Route path="special-payments/details/:id" element={<SPDetail />} />
              <Route path="special-payments/types" element={<PaymentTypes />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/apply" element={<AddExpense selfService />} />
              <Route path="expenses/add" element={<AddExpense />} />
              <Route path="expenses/edit/:id" element={<AddExpense />} />
              <Route path="expenses/details/:id" element={<ExpenseDetail />} />
              <Route path="notifications" element={<AllNotifications />} />
            </Route>
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default Router;
