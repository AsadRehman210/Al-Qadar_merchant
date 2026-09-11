// ─────────────────────────────────────────────────────────────────────────────
// ERP permission catalog (admin portal). Keys here are the exact strings the
// backend's `source/utility/helper/constants/permissions.ts` enforces — keep
// the two in sync. `alqadar_role_ids` maps readable JS identifiers to those
// strings (used by `menuSections` + page-level `checkRoleAuth`);
// `alqadar_roles` is the module tree the Role builder renders as checkboxes.
//
// The Account owner (is_default_user) bypasses every check. A sub-user holds
// exactly the strings their assigned Role grants.
// ─────────────────────────────────────────────────────────────────────────────

const crud = (base) => ({
  [`view_${key(base)}`]: `${base}.view`,
  [`add_${key(base)}`]: `${base}.create`,
  [`edit_${key(base)}`]: `${base}.edit`,
  [`delete_${key(base)}`]: `${base}.delete`,
});
function key(base) {
  return base.replace(/[.-]/g, "_");
}

export const alqadar_role_ids = {
  // Access control
  ...crud("user"),
  ...crud("role"),

  // Platform
  view_dashboard: "dashboard.view",
  ...crud("merchant-management"),
  view_reports: "reports.view",
  view_settings: "settings.view",
  edit_settings: "settings.edit",

  // HR
  ...crud("employee"),
  ...crud("department"),
  ...crud("designation"),
  ...crud("attendance"),
  ...crud("attendance-policy"),
  ...crud("salary"),
  ...crud("loan"),
  approve_loan: "loan.approve",
  ...crud("expense"),
  approve_expense: "expense.approve",
  ...crud("leave"),
  approve_leave: "leave.approve",
  ...crud("leave-type"),
  ...crud("payroll-run"),
  process_payroll_run: "payroll-run.process",
  ...crud("special-payment"),
  ...crud("special-payment-type"),
  ...crud("provident-fund"),
  ...crud("employee-request"),
  approve_employee_request: "employee-request.approve",
  ...crud("holiday"),
  ...crud("announcement"),
  ...crud("recruitment"),
  ...crud("candidate"),
  ...crud("onboarding"),
  ...crud("onboarding-template"),
  ...crud("offboarding"),
  ...crud("performance"),

  // Finance
  ...crud("finance-coa"),
  ...crud("finance-journal"),
  view_finance_ledger: "finance-ledger.view",
  view_finance_reports: "finance-reports.view",
  ...crud("finance-bank"),
  ...crud("finance-payable"),
  ...crud("finance-receivable"),
  ...crud("finance-payment"),
  ...crud("finance-income"),
  ...crud("finance-expense"),
  ...crud("finance-vat"),
  ...crud("finance-bank-statement"),
  ...crud("finance-reconciliation"),
  ...crud("finance-budget"),

  // Inventory
  ...crud("inventory-category"),
  ...crud("inventory-product"),
  import_inventory_product: "inventory-product.import",
  ...crud("inventory-variant"),
  ...crud("inventory-production"),
  view_inventory_opening_stock: "inventory-opening-stock.view",
  add_inventory_opening_stock: "inventory-opening-stock.create",
  ...crud("inventory-quarantine"),
  view_inventory_stock_batch: "inventory-stock-batch.view",

  // Warehouse
  ...crud("warehouse"),
  ...crud("warehouse-stock"),
  ...crud("warehouse-transfer"),
  ...crud("warehouse-issue"),

  // Sales
  ...crud("sales-customer"),
  ...crud("sales-invoice"),
  status_sales_invoice: "sales-invoice.status",
  ...crud("sales-quotation"),
  status_sales_quotation: "sales-quotation.status",
  ...crud("sales-credit-note"),
  status_sales_credit_note: "sales-credit-note.status",

  // Purchase
  ...crud("purchase-supplier"),
  ...crud("purchase-invoice"),
  status_purchase_invoice: "purchase-invoice.status",
  ...crud("purchase-debit-note"),
  status_purchase_debit_note: "purchase-debit-note.status",

  // Assets
  ...crud("asset-category"),
  ...crud("asset"),
  import_asset: "asset.import",
  ...crud("asset-request"),
  approve_asset_request: "asset-request.approve",
  ...crud("asset-audit"),
  ...crud("asset-purchase"),
  status_asset_purchase: "asset-purchase.status",

  // Analytics
  view_analytics_hr: "analytics-hr.view",
  view_analytics_inventory: "analytics-inventory.view",
  view_analytics_sales: "analytics-sales.view",

  // ── Legacy universal placeholders ─────────────────────────────────────────
  // Earlier partial-port pages gate every "Add"/"View" button on these four
  // regardless of module. `checkRoleAuth` treats them as wildcards for a
  // sub-user (defers to the sidebar + backend, which enforce per module), so
  // these stay valid keys without over-hiding.
  view_customer: "sales-customer.view",
  add_customer: "sales-customer.create",
  edit_customer: "sales-customer.edit",
  delete_customer: "sales-customer.delete",
};

// Set of the legacy wildcard placeholder strings — consumed by
// global/helper.js `checkRoleAuth`.
// Previously held sales-customer.* as universal placeholders for unfinished
// modules. Operations pages now use real module keys, so this set is empty —
// Customers enforce sales-customer.* like every other module.
export const LEGACY_WILDCARD_PERMISSIONS = new Set([]);

const grp = (title, title_key, subs) => ({
  title,
  title_key,
  sub_modules: subs.map(([id, t, tk]) => ({ id, title: t, title_key: tk })),
});

const section = (title, title_key, modules) => ({ title, title_key, modules });

function crudRows(base, label) {
  const k = key(base);
  return [
    [alqadar_role_ids[`view_${k}`], `View ${label}`, `view_${k}`],
    [alqadar_role_ids[`add_${k}`], `Add ${label}`, `add_${k}`],
    [alqadar_role_ids[`edit_${k}`], `Edit ${label}`, `edit_${k}`],
    [alqadar_role_ids[`delete_${k}`], `Delete ${label}`, `delete_${k}`],
  ];
}

// Nested: section → modules (each module has CRUD/status permissions).
// PermissionMatrix renders section headers with module cards underneath.
export const alqadar_roles = [
  section("MAIN", "sidebar_main", [
    grp("Dashboard", "dashboard", [[alqadar_role_ids.view_dashboard, "View Dashboard", "view_dashboard"]]),
  ]),
  section("HR Management", "sidebar_hr", [
    grp("Recruitment / Jobs", "sidebar_recruitment", crudRows("recruitment", "Job")),
    grp("Candidates", "candidates", crudRows("candidate", "Candidate")),
    grp("Onboarding", "sidebar_onboarding", crudRows("onboarding", "Onboarding")),
    grp("Onboarding Templates", "onboarding_templates", crudRows("onboarding-template", "Onboarding Template")),
    grp("Offboarding", "sidebar_offboarding", crudRows("offboarding", "Offboarding")),
    grp("Performance", "sidebar_performance", crudRows("performance", "Appraisal")),
    grp("Employees", "employees", crudRows("employee", "Employee")),
    grp("Departments", "sidebar_departments", crudRows("department", "Department")),
    grp("Designations", "sidebar_designations", crudRows("designation", "Designation")),
    grp("Attendance", "sidebar_attendance", crudRows("attendance", "Attendance")),
    grp("Attendance Policies", "sidebar_attendance_policies", crudRows("attendance-policy", "Attendance Policy")),
    grp("Leave", "sidebar_leave_management", [
      ...crudRows("leave", "Leave"),
      [alqadar_role_ids.approve_leave, "Approve Leave", "approve_leave"],
    ]),
    grp("Leave Types", "leave_types", crudRows("leave-type", "Leave Type")),
    grp("Holidays", "sidebar_holiday_calendar", crudRows("holiday", "Holiday")),
    grp("Salary", "sidebar_salary", crudRows("salary", "Salary")),
    grp("Payroll Runs", "sidebar_payroll_batch", [
      ...crudRows("payroll-run", "Payroll Run"),
      [alqadar_role_ids.process_payroll_run, "Process Payroll", "process_payroll_run"],
    ]),
    grp("Special Payments", "sidebar_special_payments", crudRows("special-payment", "Special Payment")),
    grp("Special Payment Types", "special_payment_types", crudRows("special-payment-type", "Special Payment Type")),
    grp("Provident Fund", "sidebar_provident_fund", crudRows("provident-fund", "Provident Fund")),
    grp("Loans", "sidebar_loans", [
      ...crudRows("loan", "Loan"),
      [alqadar_role_ids.approve_loan, "Approve Loan", "approve_loan"],
    ]),
    grp("Expenses", "sidebar_expenses", [
      ...crudRows("expense", "Expense"),
      [alqadar_role_ids.approve_expense, "Approve Expense", "approve_expense"],
    ]),
    grp("Employee Requests", "sidebar_requests", [
      ...crudRows("employee-request", "Employee Request"),
      [alqadar_role_ids.approve_employee_request, "Approve Request", "approve_employee_request"],
    ]),
    grp("Announcements", "sidebar_announcements", crudRows("announcement", "Announcement")),
  ]),
  section("Asset Management", "sidebar_asset_management", [
    grp("Assets", "sidebar_assets_register", [
      ...crudRows("asset", "Asset"),
      [alqadar_role_ids.import_asset, "Import Assets", "import_asset"],
    ]),
    grp("Asset Categories", "sidebar_asset_categories", crudRows("asset-category", "Asset Category")),
    grp("Asset Requests", "sidebar_asset_requests", [
      ...crudRows("asset-request", "Asset Request"),
      [alqadar_role_ids.approve_asset_request, "Approve Asset Request", "approve_asset_request"],
    ]),
    grp("Asset Audits", "sidebar_asset_audits", crudRows("asset-audit", "Asset Audit")),
    grp("Asset Purchases", "sidebar_asset_purchases", [
      ...crudRows("asset-purchase", "Asset Purchase"),
      [alqadar_role_ids.status_asset_purchase, "Post Asset Purchase", "status_asset_purchase"],
    ]),
  ]),
  section("Products & Inventory", "sidebar_products_inventory", [
    grp("Products", "sidebar_products", [
      ...crudRows("inventory-product", "Product"),
      [alqadar_role_ids.import_inventory_product, "Import Products", "import_inventory_product"],
    ]),
    grp("Categories", "sidebar_categories", crudRows("inventory-category", "Category")),
    grp("Variants", "sidebar_variants", crudRows("inventory-variant", "Variant")),
    grp("Production", "sidebar_production", crudRows("inventory-production", "Production")),
    grp("Quarantine", "sidebar_quarantine", crudRows("inventory-quarantine", "Quarantine")),
    grp("Stock Batches", "stock_batches", [
      [alqadar_role_ids.view_inventory_stock_batch, "View Stock Batches", "view_inventory_stock_batch"],
    ]),
    grp("Opening Stock Import", "opening_stock_import", [
      [alqadar_role_ids.view_inventory_opening_stock, "View Opening Stock Import", "view_inventory_opening_stock"],
      [alqadar_role_ids.add_inventory_opening_stock, "Run Opening Stock Import", "add_inventory_opening_stock"],
    ]),
  ]),
  section("Warehouse", "sidebar_warehouse", [
    grp("Warehouses", "sidebar_warehouses", crudRows("warehouse", "Warehouse")),
    grp("Warehouse Stock", "sidebar_stock", crudRows("warehouse-stock", "Stock")),
    grp("Stock Transfers", "sidebar_stock_transfers", crudRows("warehouse-transfer", "Stock Transfer")),
    grp("Stock Issues", "sidebar_stock_issues", crudRows("warehouse-issue", "Stock Issue")),
  ]),
  section("Clients & Vendors", "sidebar_clients_vendors", [
    grp("Customers", "customers", crudRows("sales-customer", "Customer")),
    grp("Suppliers", "suppliers", crudRows("purchase-supplier", "Supplier")),
    grp("Sale Invoices", "sales", [
      ...crudRows("sales-invoice", "Sale Invoice"),
      [alqadar_role_ids.status_sales_invoice, "Change Sale Invoice Status", "status_sales_invoice"],
    ]),
    grp("Quotations", "sidebar_quotations", [
      ...crudRows("sales-quotation", "Quotation"),
      [alqadar_role_ids.status_sales_quotation, "Change Quotation Status", "status_sales_quotation"],
    ]),
    grp("Credit Notes", "sidebar_credit_notes", [
      ...crudRows("sales-credit-note", "Credit Note"),
      [alqadar_role_ids.status_sales_credit_note, "Change Credit Note Status", "status_sales_credit_note"],
    ]),
    grp("Purchase Invoices", "purchases", [
      ...crudRows("purchase-invoice", "Purchase Invoice"),
      [alqadar_role_ids.status_purchase_invoice, "Change Purchase Invoice Status", "status_purchase_invoice"],
    ]),
    grp("Debit Notes", "sidebar_debit_notes", [
      ...crudRows("purchase-debit-note", "Debit Note"),
      [alqadar_role_ids.status_purchase_debit_note, "Change Debit Note Status", "status_purchase_debit_note"],
    ]),
  ]),
  section("Merchants", "sidebar_merchants_group", [
    grp("Merchants", "sidebar_merchants", [
      [alqadar_role_ids.view_merchant_management, "View Merchants", "view_merchant_management"],
      [alqadar_role_ids.add_merchant_management, "Add Merchant", "add_merchant_management"],
      [alqadar_role_ids.edit_merchant_management, "Edit Merchant", "edit_merchant_management"],
      [alqadar_role_ids.delete_merchant_management, "Delete Merchant", "delete_merchant_management"],
    ]),
  ]),
  section("Finance Management", "sidebar_finance_management", [
    grp("Chart of Accounts", "sidebar_finance_coa", crudRows("finance-coa", "Chart of Accounts")),
    grp("Journal Entries", "sidebar_finance_journal", crudRows("finance-journal", "Journal Entry")),
    grp("Ledger", "sidebar_finance_ledger", [
      [alqadar_role_ids.view_finance_ledger, "View Ledger", "view_finance_ledger"],
    ]),
    grp("Financial Reports", "sidebar_finance_reports", [
      [alqadar_role_ids.view_finance_reports, "View Financial Reports", "view_finance_reports"],
    ]),
    grp("Bank & Cash", "sidebar_finance_bank", crudRows("finance-bank", "Bank & Cash")),
    grp("Accounts Payable", "sidebar_finance_ap", crudRows("finance-payable", "Accounts Payable")),
    grp("Accounts Receivable", "sidebar_finance_ar", crudRows("finance-receivable", "Accounts Receivable")),
    grp("Payments", "sidebar_finance_payments", crudRows("finance-payment", "Payment")),
    grp("Income", "sidebar_finance_income", crudRows("finance-income", "Income")),
    grp("Business Expenses", "sidebar_finance_expenses_module", crudRows("finance-expense", "Business Expense")),
    grp("VAT Config", "sidebar_finance_vat", crudRows("finance-vat", "VAT Config")),
    grp("Bank Statements", "bank_statements", crudRows("finance-bank-statement", "Bank Statement")),
    grp("Reconciliation", "sidebar_finance_reconciliation", crudRows("finance-reconciliation", "Reconciliation")),
    grp("Budgets", "budgets", crudRows("finance-budget", "Budget")),
  ]),
  section("Reports", "sidebar_reports", [
    grp("Reports Hub", "sidebar_reports_hub", [
      [alqadar_role_ids.view_reports, "View Reports", "view_reports"],
    ]),
    grp("HR Analytics", "hr_analytics", [
      [alqadar_role_ids.view_analytics_hr, "View HR Analytics", "view_analytics_hr"],
    ]),
    grp("Inventory Analytics", "inventory_analytics", [
      [alqadar_role_ids.view_analytics_inventory, "View Inventory Analytics", "view_analytics_inventory"],
    ]),
    grp("Sales Analytics", "sales_analytics", [
      [alqadar_role_ids.view_analytics_sales, "View Sales Analytics", "view_analytics_sales"],
    ]),
  ]),
  section("Access Control", "sidebar_access_control", [
    grp("Roles", "sidebar_roles", crudRows("role", "Role")),
    grp("Users", "sidebar_users", crudRows("user", "User")),
  ]),
  section("Settings", "sidebar_settings_section", [
    grp("Settings", "sidebar_settings", [
      [alqadar_role_ids.view_settings, "View Settings", "view_settings"],
      [alqadar_role_ids.edit_settings, "Edit Settings", "edit_settings"],
    ]),
  ]),
];

// Flat module list for consumers that don't need section headers (e.g. UserDetail).
export const flattenRoleModules = (sections = alqadar_roles) =>
  sections.flatMap((s) => s.modules || []);

