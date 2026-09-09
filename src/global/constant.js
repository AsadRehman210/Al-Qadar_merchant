import { alqadar_role_ids } from "global/alqadarRoles";
import { BiCategoryAlt } from "react-icons/bi";
import {
  Users,
  DollarSign,
  FileText,
  User,
  Home,
  Building2,
  Briefcase,
  Truck,
  Receipt,
  ShoppingCart,
  Boxes,
  Layers,
  Warehouse,
  Factory,
  Package2,
  Tags,
  PieChart,
  BookMarked,
  NotebookPen,
  CircleArrowDown,
  CircleArrowUp,
  Wallet,
  TrendingUp,
  Banknote,
  Landmark,
  LineChart,
  PiggyBank,
  CheckSquare,
  GitMerge,
  Award,
  Store,
  Settings,
  BarChart2,
  Star,
  BriefcaseIcon,
  ClipboardList,
  Inbox,
  CalendarDays,
  Megaphone,
  UserPlus,
  UserMinus,
  CalendarClock,
  Sparkles,
  Network,
  ShieldAlert,
  UserCheck,
  CalendarOff,
  Calculator,
  BadgeDollarSign,
  HandCoins,
  Stamp,
  PackageSearch,
  ScanLine,
  FilePenLine,
  FileMinus,
  FilePlus,
  Archive,
  Coins,
  Undo2,
  BadgePercent,
  CreditCard,
  PackageMinus,
  FolderTree,
  LayoutGrid,
  FileCheck,
  BarChart3,
  HardDrive,
  BadgeCheck,
  PackageCheck,
  PackageX,
  KeyRound,
} from "lucide-react";

export const language = [
  { id: "en", title: "english" },
  { id: "ar", title: "arabic" },
];

export const public_routes = ["/", "/register", "/forget-password"];

const {
  view_dashboard,
  view_customer,
  add_customer,
  edit_customer,
  delete_customer,
  view_user,
  add_user,
  edit_user,
  delete_user,
  view_role,
  add_role,
  edit_role,
  delete_role,
  view_reports,
  view_settings,
  edit_settings,
  view_merchant_management,
  add_merchant_management,
  edit_merchant_management,
  delete_merchant_management,
  view_finance_coa,
  add_finance_coa,
  edit_finance_coa,
  delete_finance_coa,
  view_finance_journal,
  add_finance_journal,
  edit_finance_journal,
  delete_finance_journal,
  view_finance_ledger,
  view_finance_reports,
  view_finance_bank,
  add_finance_bank,
  edit_finance_bank,
  delete_finance_bank,
  view_finance_payable,
  add_finance_payable,
  edit_finance_payable,
  delete_finance_payable,
  view_finance_receivable,
  add_finance_receivable,
  edit_finance_receivable,
  delete_finance_receivable,
  view_finance_payment,
  add_finance_payment,
  edit_finance_payment,
  delete_finance_payment,
  view_finance_income,
  add_finance_income,
  edit_finance_income,
  delete_finance_income,
  view_finance_expense,
  add_finance_expense,
  edit_finance_expense,
  delete_finance_expense,
  view_finance_vat,
  add_finance_vat,
  edit_finance_vat,
  delete_finance_vat,
  view_finance_reconciliation,
  add_finance_reconciliation,
  edit_finance_reconciliation,
  delete_finance_reconciliation,
  view_employee,
  add_employee,
  edit_employee,
  delete_employee,
  view_department,
  add_department,
  edit_department,
  delete_department,
  view_designation,
  add_designation,
  edit_designation,
  delete_designation,
  view_attendance,
  add_attendance,
  edit_attendance,
  delete_attendance,
  view_attendance_policy,
  add_attendance_policy,
  edit_attendance_policy,
  delete_attendance_policy,
  view_salary,
  add_salary,
  edit_salary,
  delete_salary,
  view_loan,
  add_loan,
  edit_loan,
  delete_loan,
  approve_loan,
  view_expense,
  add_expense,
  edit_expense,
  delete_expense,
  approve_expense,
  view_leave,
  add_leave,
  edit_leave,
  delete_leave,
  approve_leave,
  view_leave_type,
  add_leave_type,
  edit_leave_type,
  delete_leave_type,
  view_payroll_run,
  add_payroll_run,
  edit_payroll_run,
  delete_payroll_run,
  process_payroll_run,
  view_special_payment,
  add_special_payment,
  edit_special_payment,
  delete_special_payment,
  view_special_payment_type,
  add_special_payment_type,
  edit_special_payment_type,
  delete_special_payment_type,
  view_provident_fund,
  add_provident_fund,
  edit_provident_fund,
  delete_provident_fund,
  view_employee_request,
  add_employee_request,
  edit_employee_request,
  delete_employee_request,
  approve_employee_request,
  view_holiday,
  add_holiday,
  edit_holiday,
  delete_holiday,
  view_announcement,
  add_announcement,
  edit_announcement,
  delete_announcement,
  view_recruitment,
  add_recruitment,
  edit_recruitment,
  delete_recruitment,
  view_onboarding,
  add_onboarding,
  edit_onboarding,
  delete_onboarding,
  view_offboarding,
  add_offboarding,
  edit_offboarding,
  delete_offboarding,
  view_performance,
  add_performance,
  edit_performance,
  delete_performance,
  view_inventory_category,
  add_inventory_category,
  edit_inventory_category,
  delete_inventory_category,
  view_inventory_product,
  add_inventory_product,
  edit_inventory_product,
  delete_inventory_product,
  view_inventory_variant,
  add_inventory_variant,
  edit_inventory_variant,
  delete_inventory_variant,
  view_warehouse_stock,
  add_warehouse_stock,
  edit_warehouse_stock,
  delete_warehouse_stock,
  view_inventory_quarantine,
  add_inventory_quarantine,
  edit_inventory_quarantine,
  delete_inventory_quarantine,
  view_inventory_production,
  add_inventory_production,
  edit_inventory_production,
  delete_inventory_production,
  view_warehouse,
  add_warehouse,
  edit_warehouse,
  delete_warehouse,
  view_warehouse_transfer,
  add_warehouse_transfer,
  edit_warehouse_transfer,
  delete_warehouse_transfer,
  view_warehouse_issue,
  add_warehouse_issue,
  edit_warehouse_issue,
  delete_warehouse_issue,
  view_purchase_supplier,
  add_purchase_supplier,
  edit_purchase_supplier,
  delete_purchase_supplier,
  view_sales_invoice,
  add_sales_invoice,
  edit_sales_invoice,
  delete_sales_invoice,
  view_sales_quotation,
  add_sales_quotation,
  edit_sales_quotation,
  delete_sales_quotation,
  view_sales_credit_note,
  add_sales_credit_note,
  edit_sales_credit_note,
  delete_sales_credit_note,
  view_purchase_invoice,
  add_purchase_invoice,
  edit_purchase_invoice,
  delete_purchase_invoice,
  view_purchase_debit_note,
  add_purchase_debit_note,
  edit_purchase_debit_note,
  delete_purchase_debit_note,
  view_asset,
  add_asset,
  edit_asset,
  delete_asset,
  view_asset_category,
  add_asset_category,
  edit_asset_category,
  delete_asset_category,
  view_asset_request,
  add_asset_request,
  edit_asset_request,
  delete_asset_request,
  view_asset_audit,
  add_asset_audit,
  edit_asset_audit,
  delete_asset_audit,
} = alqadar_role_ids;
export const menuSections = [
  {
    title: "MAIN",
    titleKey: "sidebar_main",
    icon: Home,
    role: view_dashboard,
    items: [
      {
        name: "Dashboard",
        nameKey: "sidebar_dashboard",
        href: "/dashboard",
        icon: Home,
        role: view_dashboard,
      },
    ],
  },
  {
    title: "HR Management",
    titleKey: "sidebar_hr",
    icon: Users,
    role: `${view_employee},${view_department},${view_designation},${view_attendance},${view_attendance_policy},${view_leave},${view_holiday},${view_salary},${view_payroll_run},${view_provident_fund},${view_special_payment},${view_loan},${view_expense},${view_employee_request},${view_announcement},${view_recruitment},${view_onboarding},${view_offboarding},${view_performance}`,
    items: [
      {
        name: "Talent & Lifecycle",
        nameKey: "sidebar_grp_talent",
        icon: Sparkles,
        role: `${view_recruitment},${view_onboarding},${view_performance},${view_offboarding}`,
        children: [
          {
            name: "Recruitment",
            nameKey: "sidebar_recruitment",
            href: "/recruitment",
            icon: BriefcaseIcon,
            role: `${view_recruitment},${add_recruitment},${edit_recruitment},${delete_recruitment}`,
          },
          {
            name: "Onboarding",
            nameKey: "sidebar_onboarding",
            href: "/onboarding",
            icon: UserPlus,
            role: `${view_onboarding},${add_onboarding},${edit_onboarding},${delete_onboarding}`,
          },
          {
            name: "Performance",
            nameKey: "sidebar_performance",
            href: "/performance",
            icon: Star,
            role: `${view_performance},${add_performance},${edit_performance},${delete_performance}`,
          },
          {
            name: "Offboarding",
            nameKey: "sidebar_offboarding",
            href: "/offboarding",
            icon: UserMinus,
            role: `${view_offboarding},${add_offboarding},${edit_offboarding},${delete_offboarding}`,
          },
        ],
      },
      {
        name: "Organization",
        nameKey: "sidebar_grp_organization",
        icon: LayoutGrid,
        role: `${view_department},${view_employee},${view_designation}`,
        children: [
          {
            name: "Departments",
            nameKey: "sidebar_departments",
            href: "/departments",
            icon: FolderTree,
            role: `${view_department},${add_department},${edit_department},${delete_department}`,
          },
          {
            name: "Employees",
            nameKey: "sidebar_employees",
            href: "/employees",
            icon: Briefcase,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee}`,
          },
          {
            name: "Designations",
            nameKey: "sidebar_designations",
            href: "/designations",
            icon: Award,
            role: `${view_designation},${add_designation},${edit_designation},${delete_designation}`,
          },
          {
            name: "Org Chart",
            nameKey: "sidebar_org_chart",
            href: "/org-chart",
            icon: Network,
            role: `${view_employee}`,
          },
          {
            name: "Compliance",
            nameKey: "sidebar_compliance",
            href: "/compliance",
            icon: ShieldAlert,
            role: `${view_employee}`,
          },
        ],
      },
      {
        name: "Time & Attendance",
        nameKey: "sidebar_grp_time_attendance",
        icon: CalendarClock,
        role: `${view_attendance},${view_leave},${view_holiday},${view_attendance_policy}`,
        children: [
          {
            name: "Attendance",
            nameKey: "sidebar_attendance",
            href: "/attendance",
            icon: UserCheck,
            role: `${view_attendance},${add_attendance},${edit_attendance},${delete_attendance}`,
          },
          {
            name: "Leave Management",
            nameKey: "sidebar_leave_management",
            href: "/leave-management",
            icon: CalendarOff,
            role: `${view_leave},${add_leave},${edit_leave},${delete_leave},${approve_leave}`,
          },
          {
            name: "Holiday Calendar",
            nameKey: "sidebar_holiday_calendar",
            href: "/holiday-calendar",
            icon: CalendarDays,
            role: `${view_holiday},${add_holiday},${edit_holiday},${delete_holiday}`,
          },
          {
            name: "Attendance Policies",
            nameKey: "sidebar_attendance_policies",
            href: "/attendance-policy",
            icon: FileCheck,
            role: `${view_attendance_policy},${add_attendance_policy},${edit_attendance_policy},${delete_attendance_policy}`,
          },
        ],
      },
      {
        name: "Payroll & Benefits",
        nameKey: "sidebar_grp_payroll",
        icon: Banknote,
        role: `${view_salary},${view_payroll_run},${view_provident_fund},${view_special_payment},${view_loan},${view_expense}`,
        children: [
          {
            name: "Salary",
            nameKey: "sidebar_salary",
            href: "/salary",
            icon: DollarSign,
            role: `${view_salary},${add_salary},${edit_salary},${delete_salary}`,
          },
          {
            name: "Payroll Processing",
            nameKey: "sidebar_payroll_batch",
            href: "/payroll-batch",
            icon: Calculator,
            role: `${view_payroll_run},${add_payroll_run},${edit_payroll_run},${delete_payroll_run},${process_payroll_run}`,
          },
          {
            name: "Provident Fund",
            nameKey: "sidebar_provident_fund",
            href: "/provident-fund",
            icon: PiggyBank,
            role: `${view_provident_fund},${add_provident_fund},${edit_provident_fund},${delete_provident_fund}`,
          },
          {
            name: "Special Payments",
            nameKey: "sidebar_special_payments",
            href: "/special-payments",
            icon: BadgeDollarSign,
            role: `${view_special_payment},${add_special_payment},${edit_special_payment},${delete_special_payment}`,
          },
          {
            name: "Loans",
            nameKey: "sidebar_loans",
            href: "/loans",
            icon: FileText,
            role: `${view_loan},${add_loan},${edit_loan},${delete_loan},${approve_loan}`,
          },
          {
            name: "Expenses",
            nameKey: "sidebar_expenses",
            href: "/expenses",
            icon: HandCoins,
            role: `${view_expense},${add_expense},${edit_expense},${delete_expense},${approve_expense}`,
          },
        ],
      },
      {
        name: "Requests & Approvals",
        nameKey: "sidebar_grp_requests",
        icon: Inbox,
        role: `${view_employee_request},${approve_employee_request}`,
        children: [
          {
            name: "Employee Requests",
            nameKey: "sidebar_requests",
            href: "/requests",
            icon: ClipboardList,
            role: `${view_employee_request},${add_employee_request},${edit_employee_request},${delete_employee_request},${approve_employee_request}`,
          },
          {
            name: "My Approvals",
            nameKey: "sidebar_my_approvals",
            href: "/my-approvals",
            icon: Stamp,
            role: `${view_employee_request},${approve_employee_request}`,
          },
        ],
      },
      {
        name: "Announcements",
        nameKey: "sidebar_announcements",
        href: "/announcements",
        icon: Megaphone,
        role: `${view_announcement},${add_announcement},${edit_announcement},${delete_announcement}`,
      },
    ],
  },
  {
    title: "Asset Management",
    titleKey: "sidebar_asset_management",
    icon: Archive,
    role: `${view_asset},${view_asset_category},${view_asset_request},${view_asset_audit}`,
    items: [
      {
        name: "Assets",
        nameKey: "sidebar_assets_register",
        href: "/assets",
        icon: HardDrive,
        role: `${view_asset},${add_asset},${edit_asset},${delete_asset}`,
      },
      {
        name: "Asset categories",
        nameKey: "sidebar_asset_categories",
        href: "/assets-categories",
        icon: Tags,
        role: `${view_asset_category},${add_asset_category},${edit_asset_category},${delete_asset_category}`,
      },
      {
        name: "Asset requests",
        nameKey: "sidebar_asset_requests",
        href: "/assets/requests",
        icon: PackageSearch,
        role: `${view_asset_request},${add_asset_request},${edit_asset_request},${delete_asset_request}`,
      },
      {
        name: "Asset audits",
        nameKey: "sidebar_asset_audits",
        href: "/assets/audits",
        icon: ScanLine,
        role: `${view_asset_audit},${add_asset_audit},${edit_asset_audit},${delete_asset_audit}`,
      },
      {
        name: "Asset reports",
        nameKey: "sidebar_asset_reports",
        href: "/assets/reports",
        icon: BarChart3,
        role: `${view_asset}`,
      },
    ],
  },
  {
    title: "Products & Inventory",
    titleKey: "sidebar_products_inventory",
    icon: Package2,
    role: `${view_inventory_category},${view_inventory_product},${view_inventory_variant},${view_warehouse_stock},${view_inventory_quarantine},${view_inventory_production}`,
    items: [
      {
        name: "Categories",
        nameKey: "sidebar_categories",
        href: "/inventory/categories",
        icon: BiCategoryAlt,
        role: `${view_inventory_category},${add_inventory_category},${edit_inventory_category},${delete_inventory_category}`,
      },
      {
        name: "Products",
        nameKey: "sidebar_products",
        href: "/inventory/products",
        icon: Boxes,
        role: `${view_inventory_product},${add_inventory_product},${edit_inventory_product},${delete_inventory_product}`,
      },
      {
        name: "Variants",
        nameKey: "sidebar_variants",
        href: "/inventory/variants",
        icon: Layers,
        role: `${view_inventory_variant},${add_inventory_variant},${edit_inventory_variant},${delete_inventory_variant}`,
      },
      {
        name: "Stock",
        nameKey: "sidebar_stock",
        href: "/inventory/stock",
        icon: PackageCheck,
        role: `${view_warehouse_stock},${add_warehouse_stock},${edit_warehouse_stock},${delete_warehouse_stock}`,
      },
      {
        name: "Not for sale",
        nameKey: "sidebar_quarantine",
        href: "/inventory/quarantine",
        icon: PackageX,
        role: `${view_inventory_quarantine},${add_inventory_quarantine},${edit_inventory_quarantine},${delete_inventory_quarantine}`,
      },
      {
        name: "Production",
        nameKey: "sidebar_production",
        href: "/inventory/production",
        icon: Factory,
        role: `${view_inventory_production},${add_inventory_production},${edit_inventory_production},${delete_inventory_production}`,
      },
    ],
  },
  {
    title: "Warehouse",
    titleKey: "sidebar_warehouse",
    icon: Warehouse,
    role: `${view_warehouse},${view_warehouse_transfer},${view_warehouse_issue}`,
    items: [
      { name: "Warehouses",       nameKey: "sidebar_warehouses",      href: "/warehouse",            icon: Warehouse, role: `${view_warehouse},${add_warehouse},${edit_warehouse},${delete_warehouse}` },
      { name: "Stock Transfers",  nameKey: "sidebar_stock_transfers",  href: "/warehouse_transfers",  icon: GitMerge,  role: `${view_warehouse_transfer},${add_warehouse_transfer},${edit_warehouse_transfer},${delete_warehouse_transfer}` },
      { name: "Stock Issues",     nameKey: "sidebar_stock_issues",     href: "/warehouse_issues",     icon: PackageMinus, role: `${view_warehouse_issue},${add_warehouse_issue},${edit_warehouse_issue},${delete_warehouse_issue}` },
    ],
  },
  {
    title: "Clients & Vendors",
    titleKey: "sidebar_clients_vendors",
    icon: Store,
    role: `${view_customer},${view_purchase_supplier},${view_sales_invoice},${view_sales_quotation},${view_sales_credit_note},${view_purchase_invoice},${view_purchase_debit_note}`,
    items: [
      {
        name: "Customers",
        nameKey: "sidebar_customers_item",
        href: "/customers",
        icon: User,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Suppliers",
        nameKey: "sidebar_suppliers_item",
        href: "/suppliers",
        icon: Truck,
        role: `${view_purchase_supplier},${add_purchase_supplier},${edit_purchase_supplier},${delete_purchase_supplier}`,
      },
      {
        name: "Sales",
        nameKey: "sidebar_sales_item",
        href: "/sales",
        icon: Receipt,
        role: `${view_sales_invoice},${add_sales_invoice},${edit_sales_invoice},${delete_sales_invoice}`,
      },
      {
        name: "Quotations",
        nameKey: "sidebar_quotations",
        href: "/quotation",
        icon: FilePenLine,
        role: `${view_sales_quotation},${add_sales_quotation},${edit_sales_quotation},${delete_sales_quotation}`,
      },
      {
        name: "Credit Notes",
        nameKey: "sidebar_credit_notes",
        href: "/credit-notes",
        icon: FileMinus,
        role: `${view_sales_credit_note},${add_sales_credit_note},${edit_sales_credit_note},${delete_sales_credit_note}`,
      },
      {
        name: "Purchases",
        nameKey: "sidebar_purchases_item",
        href: "/purchases",
        icon: ShoppingCart,
        role: `${view_purchase_invoice},${add_purchase_invoice},${edit_purchase_invoice},${delete_purchase_invoice}`,
      },
      {
        name: "Debit Notes",
        nameKey: "sidebar_debit_notes",
        href: "/debit-notes",
        icon: FilePlus,
        role: `${view_purchase_debit_note},${add_purchase_debit_note},${edit_purchase_debit_note},${delete_purchase_debit_note}`,
      },
    ],
  },
  {
    title: "Merchants",
    titleKey: "sidebar_merchants_group",
    icon: BadgeCheck,
    role: `${view_merchant_management},${add_merchant_management},${edit_merchant_management},${delete_merchant_management}`,
    items: [
      {
        name: "Merchants",
        nameKey: "sidebar_merchants",
        href: "/merchant-management",
        icon: BadgeCheck,
        role: `${view_merchant_management},${add_merchant_management},${edit_merchant_management},${delete_merchant_management}`,
      },
    ],
  },
  {
    title: "Finance Management",
    titleKey: "sidebar_finance_management",
    icon: Landmark,
    role: `${view_finance_coa},${view_finance_ledger},${view_finance_journal},${view_finance_receivable},${view_finance_payable},${view_finance_expense},${view_finance_income},${view_finance_payment},${view_finance_bank},${view_finance_reports},${view_finance_reconciliation},${view_finance_vat}`,
    items: [
      {
        name: "Chart of Accounts",
        nameKey: "sidebar_finance_coa",
        href: "/finance/coa",
        icon: PieChart,
        role: `${view_finance_coa},${add_finance_coa},${edit_finance_coa},${delete_finance_coa}`,
      },
      {
        name: "Ledger",
        nameKey: "sidebar_finance_ledger",
        href: "/finance/ledger",
        icon: BookMarked,
        role: `${view_finance_ledger}`,
      },
      {
        name: "Journal entries",
        nameKey: "sidebar_finance_journal",
        href: "/finance/journal",
        icon: NotebookPen,
        role: `${view_finance_journal},${add_finance_journal},${edit_finance_journal},${delete_finance_journal}`,
      },
      {
        name: "Accounts Receivable",
        nameKey: "sidebar_finance_ar",
        href: "/finance/receivable",
        icon: CircleArrowDown,
        role: `${view_finance_receivable},${add_finance_receivable},${edit_finance_receivable},${delete_finance_receivable}`,
      },
      {
        name: "Accounts Payable",
        nameKey: "sidebar_finance_ap",
        href: "/finance/payable",
        icon: CircleArrowUp,
        role: `${view_finance_payable},${add_finance_payable},${edit_finance_payable},${delete_finance_payable}`,
      },
      {
        name: "Expense management",
        nameKey: "sidebar_finance_expenses_module",
        href: "/finance/expenses",
        icon: Wallet,
        role: `${view_finance_expense},${add_finance_expense},${edit_finance_expense},${delete_finance_expense}`,
      },
      {
        name: "Income / Revenue",
        nameKey: "sidebar_finance_income",
        href: "/finance/income",
        icon: TrendingUp,
        role: `${view_finance_income},${add_finance_income},${edit_finance_income},${delete_finance_income}`,
      },
      {
        name: "Payments",
        nameKey: "sidebar_finance_payments",
        href: "/finance/payments",
        icon: Banknote,
        role: `${view_finance_payment},${add_finance_payment},${edit_finance_payment},${delete_finance_payment}`,
      },
      {
        name: "Bank & Cash",
        nameKey: "sidebar_finance_bank",
        href: "/finance/bank-cash",
        icon: Coins,
        role: `${view_finance_bank},${add_finance_bank},${edit_finance_bank},${delete_finance_bank}`,
      },
      {
        name: "Financial reports",
        nameKey: "sidebar_finance_reports",
        href: "/finance/reports",
        icon: LineChart,
        role: `${view_finance_reports}`,
      },
      {
        name: "Bank Reconciliation",
        nameKey: "sidebar_finance_reconciliation",
        href: "/finance/bank-reconciliation",
        icon: CheckSquare,
        role: `${view_finance_reconciliation},${add_finance_reconciliation},${edit_finance_reconciliation},${delete_finance_reconciliation}`,
      },
      {
        name: "Recoverable Tax",
        nameKey: "sidebar_finance_recoverable_tax",
        href: "/finance/recoverable-tax",
        icon: Undo2,
        role: `${view_finance_vat},${add_finance_vat},${edit_finance_vat},${delete_finance_vat}`,
      },
      {
        name: "Collected Tax",
        nameKey: "sidebar_finance_collected_tax",
        href: "/finance/collected-tax",
        icon: BadgePercent,
        role: `${view_finance_vat},${add_finance_vat},${edit_finance_vat},${delete_finance_vat}`,
      },
      {
        name: "Tax Payment",
        nameKey: "sidebar_finance_tax_payment",
        href: "/finance/tax-payment",
        icon: CreditCard,
        role: `${view_finance_vat},${add_finance_vat},${edit_finance_vat},${delete_finance_vat}`,
      },
    ],
  },
  {
    title: "Reports",
    titleKey: "sidebar_reports",
    icon: BarChart2,
    role: `${view_reports}`,
    items: [
      { name: "Reports Hub",      nameKey: "sidebar_reports_hub",     href: "/reports",              icon: BarChart2, role: `${view_reports}` },
    ],
  },
  {
    title: "Access Control",
    titleKey: "sidebar_access_control",
    icon: KeyRound,
    role: `${view_user},${view_role}`,
    items: [
      { name: "Roles",            nameKey: "sidebar_roles",           href: "/roles",                icon: ShieldAlert, role: `${view_role},${add_role},${edit_role},${delete_role}` },
      { name: "Users",            nameKey: "sidebar_users",           href: "/users",                icon: UserCheck, role: `${view_user},${add_user},${edit_user},${delete_user}` },
    ],
  },
  {
    title: "Settings",
    titleKey: "sidebar_settings_section",
    icon: Settings,
    role: `${view_settings},${edit_settings}`,
    items: [
      { name: "Settings",         nameKey: "sidebar_settings",        href: "/settings",             icon: Settings,  role: `${view_settings},${edit_settings}` },
    ],
  },
];

export const breadcrumbs = [
  {
    title: "dashboard",
    url: "/dashboard",
    description: "Statistics and Reports",
  },
  {
    title: "employees",
    url: "/employees",
    description: "Manage Employees",
  },
  {
    title: "sidebar_onboarding",
    url: "/onboarding",
    description: "Employee onboarding workflows",
  },
  {
    title: "sidebar_offboarding",
    url: "/offboarding",
    description: "Employee offboarding workflows",
  },
  {
    title: "sidebar_departments",
    url: "/departments",
    description: "Manage departments",
  },
  {
    title: "sidebar_org_chart",
    url: "/org-chart",
    description: "Organization chart",
  },
  {
    title: "sidebar_compliance",
    url: "/compliance",
    description: "Employee compliance records",
  },
  {
    title: "sidebar_attendance",
    url: "/attendance",
    description: "Daily attendance records",
  },
  {
    title: "sidebar_holiday_calendar",
    url: "/holiday-calendar",
    description: "Company holiday calendar",
  },
  {
    title: "sidebar_attendance_policies",
    url: "/attendance-policy",
    description: "Attendance policy rules",
  },
  {
    title: "sidebar_salary",
    url: "/salary",
    description: "Employee salary records",
  },
  {
    title: "sidebar_loans",
    url: "/loans",
    description: "Employee loans",
  },
  {
    title: "sidebar_expenses",
    url: "/expenses",
    description: "Employee expense claims",
  },
  {
    title: "sidebar_requests",
    url: "/requests",
    description: "Employee requests",
  },
  {
    title: "sidebar_my_approvals",
    url: "/my-approvals",
    description: "Pending approvals",
  },
  {
    title: "sidebar_announcements",
    url: "/announcements",
    description: "Company announcements",
  },
  {
    title: "customers",
    url: "/customers",
    description: "Manage Customers",
  },
  {
    title: "suppliers",
    url: "/suppliers",
    description: "Manage Suppliers",
  },
  {
    title: "sales",
    url: "/sales",
    description: "Sale invoices",
  },
  {
    title: "purchases",
    url: "/purchases",
    description: "Purchase invoices",
  },
  {
    title: "sidebar_quotations",
    url: "/quotation",
    description: "Sales quotations",
  },
  {
    title: "sidebar_credit_notes",
    url: "/credit-notes",
    description: "Manage sales returns and credit notes",
  },
  {
    title: "sidebar_debit_notes",
    url: "/debit-notes",
    description: "Manage purchase returns and debit notes",
  },
  {
    title: "sidebar_products",
    url: "/inventory/products",
    description: "Manage inventory products",
  },
  {
    title: "sidebar_variants",
    url: "/inventory/variants",
    description: "Manage product variants",
  },
  {
    title: "sidebar_categories",
    url: "/inventory/categories",
    description: "Manage categories",
  },
  {
    title: "sidebar_stock",
    url: "/inventory/stock",
    description: "Stock levels",
  },
  {
    title: "sidebar_quarantine",
    url: "/inventory/quarantine",
    description: "Not-for-sale returned stock",
  },
  {
    title: "sidebar_production",
    url: "/inventory/production",
    description: "Manufacturing and production orders",
  },
  {
    title: "sidebar_asset_categories",
    url: "/assets-categories",
    description: "Asset category taxonomy",
  },
  {
    title: "sidebar_assets_register",
    url: "/assets",
    description: "Company assets register",
  },
  {
    title: "sidebar_asset_requests",
    url: "/assets/requests",
    description: "Employee asset requests and approvals",
  },
  {
    title: "sidebar_asset_audits",
    url: "/assets/audits",
    description: "Physical asset verification / stock-take",
  },
  {
    title: "sidebar_asset_reports",
    url: "/assets/reports",
    description: "Depreciation, disposal and insurance reports",
  },
  {
    title: "finance_bank_ledger",
    url: "/finance/bank-cash/account",
    description: "Bank account transactions",
  },
  {
    title: "sidebar_finance_bank",
    url: "/finance/bank-cash",
    description: "Bank and cash accounts",
  },
  {
    title: "sidebar_finance_ar",
    url: "/finance/receivable",
    description: "Accounts receivable",
  },
  {
    title: "sidebar_finance_expenses_module",
    url: "/finance/expenses",
    description: "Finance expenses",
  },
  {
    title: "sidebar_finance_payments",
    url: "/finance/payments",
    description: "Payments",
  },
  {
    title: "sidebar_finance_reports",
    url: "/finance/reports",
    description: "Financial reports",
  },
  {
    title: "sidebar_finance_journal",
    url: "/finance/journal",
    description: "Journal entries",
  },
  {
    title: "sidebar_finance_ap",
    url: "/finance/payable",
    description: "Accounts payable",
  },
  {
    title: "sidebar_finance_ledger",
    url: "/finance/ledger",
    description: "General ledger",
  },
  {
    title: "sidebar_finance_income",
    url: "/finance/income",
    description: "Income and revenue",
  },
  {
    title: "sidebar_finance_coa",
    url: "/finance/coa",
    description: "Chart of accounts",
  },
  {
    title: "sidebar_finance_reconciliation",
    url: "/finance/bank-reconciliation",
    description: "Bank reconciliation",
  },
  {
    title: "sidebar_finance_recoverable_tax",
    url: "/finance/recoverable-tax",
    description: "Recoverable input tax by purchase invoice",
  },
  {
    title: "sidebar_finance_collected_tax",
    url: "/finance/collected-tax",
    description: "Collected output tax by sale invoice",
  },
  {
    title: "sidebar_finance_tax_payment",
    url: "/finance/tax-payment",
    description: "Net VAT payable reconciliation",
  },
  {
    title: "sidebar_designations",
    url: "/designations",
    description: "Manage designations and positions",
  },
  {
    title: "sidebar_merchants",
    url: "/merchant-management",
    description: "Manage merchants",
  },
  {
    title: "sidebar_warehouses",
    url: "/warehouse",
    description: "Manage warehouses and storage locations",
  },
  {
    title: "sidebar_stock_transfers",
    url: "/warehouse_transfers",
    description: "Stock movements between warehouses",
  },
  {
    title: "sidebar_stock_issues",
    url: "/warehouse_issues",
    description: "Outbound stock dispatch — internal use, samples, damage write-off",
  },
  {
    title: "sidebar_performance",
    url: "/performance",
    description: "Employee performance appraisals and KPIs",
  },
  {
    title: "sidebar_recruitment",
    url: "/recruitment",
    description: "Job postings, candidates and hiring pipeline",
  },
  {
    title: "sidebar_reports_hub",
    url: "/reports",
    description: "HR, inventory, finance and AR/AP reports",
  },
  {
    title: "sidebar_settings",
    url: "/settings",
    description: "Company profile and system preferences",
  },
  {
    title: "sidebar_roles",
    url: "/roles",
    description: "Manage roles and permissions",
  },
  {
    title: "add_role",
    url: "/roles/add",
    description: "Create a new role",
  },
  {
    title: "edit_role",
    url: "/roles/edit",
    description: "Edit role",
  },
  {
    title: "sidebar_users",
    url: "/users",
    description: "Manage portal users",
  },
  {
    title: "add_user",
    url: "/users/add",
    description: "Create a new user",
  },
  {
    title: "edit_user",
    url: "/users/edit",
    description: "Edit user",
  },
  {
    title: "view_user",
    url: "/users/detail",
    description: "User details",
  },
  {
    title: "sidebar_leave_management",
    url: "/leave-management",
    description: "Manage employee leave requests",
  },
  {
    title: "sidebar_payroll_batch",
    url: "/payroll-batch",
    description: "Payroll batch processing",
  },
  {
    title: "payroll:new_run",
    url: "/payroll-batch/create",
    description: "Create new payroll run",
  },
  {
    title: "pf:provident_fund",
    url: "/provident-fund",
    description: "Provident Fund management",
  },
  {
    title: "pf:pf_policy_settings",
    url: "/provident-fund/policy",
    description: "PF Policy Settings",
  },
  {
    title: "payroll:special_payments",
    url: "/special-payments",
    description: "Special / one-time bonus payments",
  },
  {
    title: "payroll:create_sp",
    url: "/special-payments/create",
    description: "Create new special payment",
  },
  {
    title: "payroll:sp_manage_types",
    url: "/special-payments/types",
    description: "Manage special payment types",
  },
  {
    title: "leave:apply_leave",
    url: "/leave-management/apply",
    description: "Apply for leave",
  },
  {
    title: "leave:add_leave_hr",
    url: "/leave-management/add",
    description: "HR direct leave entry",
  },
  {
    title: "leave:manager_approvals",
    url: "/leave-management/manager-approvals",
    description: "Pending manager approvals",
  },
  {
    title: "leave:hr_approvals",
    url: "/leave-management/hr-approvals",
    description: "Pending HR approvals",
  },
  {
    title: "leave:leave_types",
    url: "/leave-management/leave-types",
    description: "Manage leave type policies",
  },
  {
    title: "leave:leave_balances",
    url: "/leave-management/balances",
    description: "Employee leave balance summary",
  },
  {
    title: "notifications",
    url: "/notifications",
    description: "System notifications",
  },
];

export const addCompanyTabs = [
  "Details",
  "Documents",
  "Billing Info.",
  // "Employees",
  "Contact Person",
];

export const addStaffTabs = ["Details", "Documents"];

export const addCustomerTabs = ["Details", "Documents", "Billing Info."];

export const rows = [
  { id: 10, title: "10" },
  { id: 20, title: "20" },
];

// Page-size options for real (server-paginated) table listings across the
// HR module — distinct from the legacy `rows` above which other,
// still-client-paginated modules keep using.
export const tableRows = [
  { id: 10, title: "10" },
  { id: 20, title: "20" },
  { id: 30, title: "30" },
  { id: 40, title: "40" },
  { id: 50, title: "50" },
];

// Page-size options for card-grid listings (Recruitment, Announcements,
// Onboarding, Offboarding, etc.).
export const cardRows = [
  { id: 12, title: "12" },
  { id: 24, title: "24" },
  { id: 36, title: "36" },
  { id: 48, title: "48" },
  { id: 60, title: "60" },
];

// Default page size for Department/Designation-style paginated dropdown
// pickers (infinite-scroll, loads the next 50 on scroll).
export const DROPDOWN_PAGE_LIMIT = 50;

export const gender = [
  {
    id: 1,
    title: "male",
  },
  {
    id: 2,
    title: "female",
  },
  {
    id: 3,
    title: "other",
  },
];

export const status_list = [
  {
    id: "1,2",
    title: "active",
    bg: "bg-active",
    text: "text-[#ffffff]",
    pill: "bg-active text-[#ffffff]",
  },
  {
    id: 4,
    title: "inactive",
    bg: "bg-red-100",
    text: "text-red/70",
    pill: "bg-red-100 text-red/70",
  },
];

export const ibanLengths = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  CH: 21,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
};

export const colors = [
  { title: "black", value: "bg-[#000]" },
  { title: "golden brown", value: "bg-[#A99C71]" },
  { title: "dark cyan", value: "bg-[#36987F]" },
  { title: "light gray", value: "bg-[#C6C8BD]" },
  { title: "light blue", value: "bg-[#81A1BC]" },
  { title: "red", value: "bg-[#BD322E]" },
  { title: "dark green", value: "bg-[#0D612F]" },
  { title: "white", value: "bg-[#ffffff]" },
];

export const statusMap = {
  1: "active",
  2: "inactive",
  3: "pending_approval",
  4: "reject",
};

export const actionTypeMap = {
  1: "active",
  2: "active",
  4: "inactive",
};

export const genderMap = {
  1: "Male",
  2: "Female",
  3: "Other",
};

export const languages = [
  { _id: "English", title: "english" },
  { _id: "Mandarin", title: "mandarin" },
  { _id: "Spanish", title: "spanish" },
  { _id: "French", title: "french" },
  { _id: "Arabic", title: "arabic" },
  { _id: "Bengali", title: "bengali" },
  { _id: "Russian", title: "russian" },
  { _id: "Portuguese", title: "portuguese" },
  { _id: "Urdu", title: "urdu" },
  { _id: "Hindi", title: "hindi" },
  { _id: "German", title: "german" },
  { _id: "Japanese", title: "japanese" },
  { _id: "Punjabi", title: "punjabi" },
  { _id: "Telugu", title: "telugu" },
  { _id: "Marathi", title: "marathi" },
  { _id: "Turkish", title: "turkish" },
  { _id: "Korean", title: "korean" },
  { _id: "Italian", title: "italian" },
  { _id: "Thai", title: "thai" },
  { _id: "Persian", title: "persian" },
  { _id: "Polish", title: "polish" },
  { _id: "Dutch", title: "dutch" },
  { _id: "Greek", title: "greek" },
  { _id: "Swedish", title: "swedish" },
  { _id: "Czech", title: "czech" },
  { _id: "Hungarian", title: "hungarian" },
  { _id: "Romanian", title: "romanian" },
  { _id: "Hebrew", title: "hebrew" },
  { _id: "Vietnamese", title: "vietnamese" },
  { _id: "Finnish", title: "finnish" },
];

export const duration_type = [
  { id: "days", title: "days" },
  { id: "hours", title: "hours" },
  { id: "minutes", title: "minutes" },
];

export const customer_type = [
  { title: "all_types", id: 3 },
  { title: "individual", id: 1 },
  { title: "business", id: 2 },
];

export const status_type = [
  {
    title: "active",
    id: "1,2",
    bg: "bg-active",
    text: "text-[#ffffff]",
    pill: "bg-active text-[#ffffff]",
  },
  {
    title: "inactive",
    id: 4,
    bg: "bg-red-100",
    text: "text-red/70",
    pill: "bg-red-100 text-red/70",
  },
];

export const status_user = [
  {
    title: "active",
    id: 1,
    bg: "bg-active",
    text: "text-[#ffffff]",
    pill: "bg-active text-[#ffffff]",
  },
  {
    title: "inactive",
    id: 2,
    bg: "bg-red-100",
    text: "text-red/70",
    pill: "bg-red-100 text-red/70",
  },
];
export const Contact_type = [
  { title: "primary", id: "Primary" },
  { title: "secondary", id: "Secondary" },
];
export const calender_filter_days = [
  {
    title: "day",
    id: "Day",
  },
  {
    title: "3_days",
    id: "3-Day",
  },
  {
    title: "week",
    id: "Week",
  },
  {
    title: "20_days",
    id: "20_days",
  },
  {
    title: "30_days",
    id: "30_days",
  },
];

export const target_User = [
  {
    id: "customer",
    title: "customer",
  },
  {
    id: "driver",
    title: "driver",
  },
  {
    id: "agency",
    title: "agency",
  },
];

export const statusTypes = [
  {
    id: 0,
    title: "Select Status",
    text: "text-black",
    pill: "border",
  },
  {
    id: 1,
    title: "Approved",
    text: "text-[#ffffff]",
    pill: "bg-active text-[#ffffff]",
  },
  {
    id: 2,
    title: "Rejected",
    bg: "bg-red-100",
    text: "text-red/70",
    pill: "bg-red-100 text-red/70",
  },
];

export const driver_status_type = [
  {
    title: "active",
    id: 1,
    bg: "bg-active",
    text: "text-[#ffffff]",
    pill: "bg-active text-[#ffffff]",
  },
  {
    title: "inactive",
    id: 2,
    bg: "bg-red-100",
    text: "text-red/70",
    pill: "bg-red-100 text-red/70",
  },
  {
    title: "pending_approval",
    id: 3,
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    pill: "bg-yellow-100 text-yellow-800",
  },
  {
    title: "reject",
    id: 4,
    bg: "bg-red-100",
    text: "text-red-700",
    pill: "bg-red-100 text-red-700",
  },
];

export const user_group = [
  {
    id: "customer",
    title: "customer",
  },
  {
    id: "agency",
    title: "agency",
  },
  {
    id: "both",
    title: "both",
  },
];

export const paymentMethodOptions = [
  { id: "Credit Card", title: "credit_card" },
  { id: "Bank Transfer", title: "bank_transfer" },
  { id: "Cash", title: "cash" },
];
export const lead_Type = [
  { title: "b2c", id: "b2c" },
  { title: "b2b", id: "b2b" },
  { title: "agent", id: "agent" },
  { title: "partner", id: "partner" },
  { title: "visa_lead", id: "visa lead" },
  { title: "driver_lead", id: "driver lead" },
  { title: "hotel_lead", id: "hotel lead" },
];

// Shared across pages that used to redeclare the same literal locally.
// Consolidated here so every module points at one source of truth.

// Dashboard chart palette (agency revenue / performance / nationality graphs).
export const chartColors = [
  "#166534",
  "#2563eb",
  "#ea580c",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#be185d",
  "#16a34a",
  "#475569",
  "#f59e0b",
];

// Generic Active/Inactive status pill classes — Departments/Categories/Products tables.
export const activeInactiveBadgeClass = {
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Inactive: "bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

// Generic Active/Inactive dropdown options (string ids) — Designations, Warehouse, AdminManagement fake data.
export const activeInactiveOptions = [
  { id: "Active", title: "Active" },
  { id: "Inactive", title: "Inactive" },
];

// "All Statuses / Active / Inactive" filter dropdown — Departments, Designations list filters.
export const statusFilterOptions = [
  { id: "", title: "All Statuses" },
  { id: "Active", title: "Active" },
  { id: "Inactive", title: "Inactive" },
];

// Credit Note / Debit Note status pill classes.
export const noteStatusBadge = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Applied: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Voided: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

// Sales quotation status pill classes.
export const quotationStatusBadge = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  Sent: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Expired: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Converted: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
};

// Purchase invoice lifecycle (Draft → Received) pill classes.
export const purchaseStatusBadge = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30",
  Ordered: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/30",
  Transit: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-500/30",
  Received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30",
};

// Shared Pending/Partial/Cleared payment-status pill classes — Purchase
// Invoice and Sale Invoice both use this exact same three-value enum.
export const paymentStatusBadge = {
  Pending: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70 ring-1 ring-inset ring-slate-200 dark:ring-white/15",
  Partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-500/25",
  Cleared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/25",
};

// Sale invoice payment-status pills (Pending / Partial / Paid).
export const salePaymentStatusBadge = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/30",
  Partial: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 ring-1 ring-inset ring-sky-200 dark:ring-sky-500/30",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30",
};

// Sale invoice delivery-status pills.
export const saleDeliveryStatusBadge = {
  Pending: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70 ring-1 ring-inset ring-slate-200 dark:ring-white/15",
  InTransit: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-500/25",
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/25",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-500/25",
};

// Finance payable (vendor bill) status pill classes.
export const financePayableStatusBadge = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  Approved: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

// Loan lifecycle status pill classes.
export const loanStatusBadge = {
  "Pending Manager": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Pending HR": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Ongoing: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const LOAN_STATUS = {
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  PENDING: "Pending",
  APPROVED: "Approved",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Expense approval lifecycle + known expense-type ids.
export const EXPENSE_STATUS = {
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const EXPENSE_TYPE_IDS = [
  "travel_transportation",
  "office_supplies",
  "meals_refreshments",
  "equipment_machinery",
  "miscellaneous_operational",
  "client_entertainment",
  "travel_lodging",
  "mobile_internet_allowance",
  "marketing_promotion",
  "gifts_incentives",
  "training_certification",
  "hardware_purchase",
  "software_licenses",
  "cloud_hosting",
  "bank_charges",
  "accounting_software",
  "travel_audit_finance",
  "communication_costs",
  "travel_client_visits",
  "training_workshops",
];

// Payroll allowance / deduction field keys — Add Employee salary tab & Employee detail salary tab.
export const salaryAllowanceKeys = [
  "hra",
  "medical_allowance",
  "transport_allowance",
  "food_allowance",
  "mobile_allowance",
  "travel_allowance",
  "other_allowances",
];

export const salaryDeductionKeys = [
  "tax",
  "provident_fund",
  "loan_deduction",
  "advance_salary",
  "insurance_deduction",
  "other_deductions",
];

// Weekday -> i18n key map — weekly schedule editor & employee official details tab.
export const weekdayLabelKeys = {
  sun: "employees:day_sun",
  mon: "employees:day_mon",
  tue: "employees:day_tue",
  wed: "employees:day_wed",
  thu: "employees:day_thu",
  fri: "employees:day_fri",
  sat: "employees:day_sat",
};

// Number-to-words tables for salary slip amount-in-words rendering.
export const numberWordsOnes = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
export const numberWordsTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
export const numberWordsTeens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

// AdminManagement / MerchantManagement billing option lists (raw English values, not i18n keys).
export const billingPaymentMethodOptions = [
  { id: "Bank Transfer", title: "Bank Transfer" },
  { id: "Card", title: "Card" },
  { id: "Cash", title: "Cash" },
  { id: "Online", title: "Online" },
];

export const billingPaymentPlanOptions = [
  { id: "Monthly", title: "Monthly" },
  { id: "Yearly", title: "Yearly" },
];

// Asset status pill classes — Asset Register table & Asset Category detail.
export const assetStatusBadge = {
  "In use": "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  "In storage": "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  Maintenance: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  Disposed: "bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white/70",
};

// Credit note / debit note lifecycle statuses.
export const noteStatusList = ["Draft", "Approved", "Applied", "Voided"];

// ─── Operations — shared dropdown options (titles ready for SelectDropdown t()) ───

export const yesNoOptions = [
  { id: "yes", title: "yes" },
  { id: "no", title: "no" },
];

export const salesTaxModeOptions = [
  { id: "same", title: "sales:tax_mode_same" },
  { id: "different", title: "sales:tax_mode_different" },
];
export const purchaseTaxModeOptions = [
  { id: "same", title: "purchase:tax_mode_same" },
  { id: "different", title: "purchase:tax_mode_different" },
];
export const taxModeOptions = salesTaxModeOptions;

export const productTypeOptions = [
  { id: "Finished Product", title: "product:finished_product" },
  { id: "Raw Material", title: "product:raw_material" },
];
export const productTypeFilterOptions = [
  { id: "", title: "product:all_types" },
  ...productTypeOptions,
];

export const purchaseLineTypeOptions = [
  { id: "raw_material", title: "purchase:raw_material" },
  { id: "final_product", title: "purchase:final_product" },
];

export const purchaseLineTypeToProductType = {
  raw_material: "Raw Material",
  final_product: "Finished Product",
};

export const purchaseStatusOptions = [
  { id: "Draft", title: "purchase:st_draft" },
  { id: "Ordered", title: "purchase:st_ordered" },
  { id: "Transit", title: "purchase:st_transit" },
  { id: "Received", title: "purchase:st_received" },
];

export const salePaymentStatusOptions = [
  { id: "Pending", title: "sales:pending" },
  { id: "Partial", title: "sales:partial" },
  { id: "Paid", title: "sales:paid" },
];

export const salePaymentStatusFilterOptions = [
  { id: "", title: "customers:all_payment_status" },
  ...salePaymentStatusOptions,
];

export const purchasePaymentStatusOptions = [
  { id: "Pending", title: "Pending" },
  { id: "Partial", title: "Partial" },
  { id: "Cleared", title: "Paid" },
];

export const paidUnpaidOptions = [
  { id: "Paid", title: "sales:paid" },
  { id: "Unpaid", title: "sales:unpaid" },
];

export const deliveryStatusOptions = [
  { id: "Pending", title: "sales:pending" },
  { id: "InTransit", title: "sales:in_transit" },
  { id: "Delivered", title: "sales:delivered" },
];

export const deliveryCancelledOption = { id: "Cancelled", title: "sales:cancelled" };

export const deliveryStatusFilterOptions = [
  ...deliveryStatusOptions,
  deliveryCancelledOption,
];

export const customerDeliveryStatusFilterOptions = [
  { id: "", title: "customers:all_delivery_status" },
  ...deliveryStatusFilterOptions,
];

export const salesPaymentMethodOptions = [
  { id: "Cash", title: "sales:cash" },
  { id: "Bank Transfer", title: "sales:bank_transfer" },
  { id: "Other", title: "sales:other" },
];
export const purchasePaymentMethodOptions = [
  { id: "Cash", title: "purchase:cash" },
  { id: "Bank Transfer", title: "purchase:bank_transfer" },
  { id: "Other", title: "purchase:other" },
];
// English titles — reusable for filters that don't need a namespace prefix.
export const cashBankOtherPaymentOptions = [
  { id: "Cash", title: "Cash" },
  { id: "Bank Transfer", title: "Bank Transfer" },
  { id: "Other", title: "Other" },
];

export const invoiceTemplateOptions = [
  { id: "Standard", title: "sales:template_standard" },
  { id: "Modern", title: "sales:template_modern" },
  { id: "Corporate", title: "sales:template_corporate" },
];

export const purchaseTaxRecoverableOptions = [
  { id: "yes", title: "purchase:tax_recoverable_yes" },
  { id: "no", title: "purchase:tax_recoverable_no" },
];

export const quotationStatusList = ["Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"];

export const quotationStatusOptions = quotationStatusList.map((s) => ({ id: s, title: s }));

export const quotationStatusFilterOptions = [
  { id: "", title: "sales:all_status" },
  ...quotationStatusOptions,
];

export const noteStatusOptions = noteStatusList.map((s) => ({ id: s, title: s }));

export const noteNextStatusMap = {
  Draft: ["Approved", "Voided"],
  Approved: ["Applied", "Voided"],
};

export const returnTypeOptions = [
  { id: "Full return", title: "Full return" },
  { id: "Partial return", title: "Partial return" },
];

export const salesReturnTypeOptions = [
  { id: "Full return", title: "sales:full_return" },
  { id: "Partial return", title: "sales:partial_return" },
];

export const purchaseReturnTypeOptions = [
  { id: "Full return", title: "purchase:full_return" },
  { id: "Partial return", title: "purchase:partial_return" },
];

export const creditNoteReasonOptions = [
  { id: "Damaged goods", title: "Damaged goods" },
  { id: "Wrong item delivered", title: "Wrong item delivered" },
  { id: "Customer return", title: "Customer return" },
  { id: "Expired", title: "Expired" },
  { id: "Wrong entry", title: "Wrong entry" },
  { id: "Other", title: "Other" },
];

export const debitNoteReasonOptions = [
  { id: "Damaged goods received", title: "Damaged goods received" },
  { id: "Short shipment", title: "Short shipment" },
  { id: "Price discrepancy", title: "Price discrepancy" },
  { id: "Wrong items received", title: "Wrong items received" },
  { id: "Quality rejection", title: "Quality rejection" },
  { id: "Expired Product", title: "Expired Product" },
  { id: "Wrong entry", title: "Wrong entry" },
  { id: "Other", title: "Other" },
];

export const stockIssueTypeOptions = [
  { id: "Internal Use", title: "Internal Use" },
  { id: "Sample", title: "Sample" },
  { id: "Damage", title: "Damage" },
  { id: "Other", title: "Other" },
];

export const stockIssueTypeFilterOptions = [
  { id: "", title: "All Types" },
  ...stockIssueTypeOptions,
];

export const stockAdjustTypeOptions = [
  { id: "add", title: "product:adj_add" },
  { id: "subtract", title: "product:adj_subtract" },
  { id: "set", title: "product:adj_set" },
];

export const stockTransferStatusFilterOptions = [
  { id: "", title: "All Statuses" },
  { id: "Pending", title: "Pending" },
  { id: "Completed", title: "Completed" },
  { id: "Cancelled", title: "Cancelled" },
];

export const batchSortOptions = [
  { id: "expiry_asc", title: "product:batch_sort_expiry_asc" },
  { id: "expiry_desc", title: "product:batch_sort_expiry_desc" },
  { id: "cost_asc", title: "product:batch_sort_cost_asc" },
  { id: "cost_desc", title: "product:batch_sort_cost_desc" },
  { id: "stock_asc", title: "product:batch_sort_stock_asc" },
  { id: "stock_desc", title: "product:batch_sort_stock_desc" },
];

export const stockLevelFilterOptions = [
  { id: "all", title: "product:stock_filter_all" },
  { id: "in_stock", title: "product:stock_status_in_stock" },
  { id: "low_stock", title: "product:stock_status_low_stock" },
  { id: "out_of_stock", title: "product:stock_status_out_of_stock" },
];

export const quarantineStatusFilterOptions = [
  { id: "all", title: "product:quarantine_filter_all" },
  { id: "Open", title: "product:quarantine_st_open" },
  { id: "Partial", title: "product:quarantine_st_partial" },
  { id: "Consumed", title: "product:quarantine_st_consumed" },
];

export const productionStatusFilterOptions = [
  { id: "all", title: "production:filter_all" },
  { id: "Draft", title: "production:st_draft" },
  { id: "InProgress", title: "production:st_in_progress" },
  { id: "Completed", title: "production:st_completed" },
  { id: "Cancelled", title: "production:st_cancelled" },
  { id: "Reversed", title: "production:st_reversed" },
];

export const assetStatusFilterOptions = [
  { id: "all", title: "asset:filter_all" },
  { id: "In use", title: "asset:st_in_use" },
  { id: "In storage", title: "asset:st_storage" },
  { id: "Maintenance", title: "asset:st_maintenance" },
  { id: "Disposed", title: "asset:st_disposed" },
];

export const assetDepreciationMethodOptions = [
  { id: "straight_line", title: "asset:straight_line" },
  { id: "declining", title: "asset:declining_balance" },
];

export const assetActiveInactiveOptions = [
  { id: "Active", title: "asset:active" },
  { id: "Inactive", title: "asset:inactive" },
];

export const assetActiveInactiveFilterOptions = [
  { id: "all", title: "asset:filter_all" },
  ...assetActiveInactiveOptions,
];

export const assetRequestStatusOptions = [
  { id: "Pending", title: "Pending" },
  { id: "Approved", title: "Approved" },
  { id: "Rejected", title: "Rejected" },
  { id: "Fulfilled", title: "Fulfilled" },
];

export const assetRequestStatusFilterOptions = [
  { id: "all", title: "asset:filter_all" },
  ...assetRequestStatusOptions,
];

export const assetRequestPriorityOptions = [
  { id: "Low", title: "Low" },
  { id: "Normal", title: "Normal" },
  { id: "High", title: "High" },
  { id: "Urgent", title: "Urgent" },
];

export const assetAuditResultOptions = [
  { id: "Pending", title: "Pending" },
  { id: "Verified", title: "Verified" },
  { id: "Missing", title: "Missing" },
  { id: "Damaged", title: "Damaged" },
];
export const assetAuditResultList = assetAuditResultOptions.map((o) => o.id);

export const assetMaintenanceTypeOptions = [
  { id: "Scheduled", title: "Scheduled" },
  { id: "Breakdown", title: "Breakdown" },
  { id: "Inspection", title: "Inspection" },
  { id: "Upgrade", title: "Upgrade" },
];

export const assetMaintenanceStatusOptions = [
  { id: "Planned", title: "Planned" },
  { id: "In Progress", title: "In Progress" },
  { id: "Completed", title: "Completed" },
];

export const assetDisposalMethodOptions = [
  { id: "Sold", title: "Sold" },
  { id: "Scrapped", title: "Scrapped" },
  { id: "Donated", title: "Donated" },
  { id: "Written Off", title: "Written Off" },
];

export const assetDocumentTypeOptions = [
  { id: "Invoice", title: "Invoice" },
  { id: "Warranty Card", title: "Warranty Card" },
  { id: "Manual", title: "Manual" },
  { id: "Photo", title: "Photo" },
  { id: "Other", title: "Other" },
];

export const customerSegmentOptions = [
  { id: "Retail", title: "customers:retail" },
  { id: "Wholesale", title: "customers:wholesale" },
  { id: "Corporate", title: "customers:corporate" },
];

export const customerTypeOptions = [
  { id: "Individual", title: "customers:individual" },
  { id: "Business", title: "customers:business" },
];

export const customerStatusOptions = [
  { id: "Active", title: "customers:active" },
  { id: "Inactive", title: "customers:inactive" },
];

export const supplierTypeOptions = [
  { id: "Company", title: "suppliers:company" },
  { id: "Individual", title: "suppliers:individual" },
];

export const supplierStatusOptions = [
  { id: "Active", title: "suppliers:active" },
  { id: "Inactive", title: "suppliers:inactive" },
];

export const partyTypeOptions = [
  { id: "Individual", title: "Individual" },
  { id: "Business", title: "Business" },
  { id: "Company", title: "Company" },
];

// ─── HR / Employee Management dropdown options ───────────────────────────────

export const employeeStatusOptions = [
  { id: "probation", title: "Probation" },
  { id: "active", title: "Active" },
  { id: "resigned", title: "Resigned" },
  { id: "retired", title: "Retired" },
  { id: "terminated", title: "Terminated" },
  { id: "absconding", title: "Absconding" },
];

export const employeeStatusBadge = {
  probation: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  resigned: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  retired: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  terminated: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  absconding: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const employeeStatusFilterOptions = [
  { id: "all", title: "All Status" },
  ...employeeStatusOptions,
];

export const nationalityOptions = [
  { id: "Saudi", title: "Saudi" },
  { id: "Expatriate", title: "Expatriate" },
];

export const genderOptions = [
  { id: "male", title: "Male" },
  { id: "female", title: "Female" },
];

export const bloodGroupOptions = [
  { id: "A+", title: "A+" },
  { id: "A-", title: "A−" },
  { id: "B+", title: "B+" },
  { id: "B-", title: "B−" },
  { id: "AB+", title: "AB+" },
  { id: "AB-", title: "AB−" },
  { id: "O+", title: "O+" },
  { id: "O-", title: "O−" },
];

export const maritalStatusOptions = [
  { id: "single", title: "Single" },
  { id: "married", title: "Married" },
];

export const employmentTypeOptions = [
  { id: "permanent", title: "Permanent" },
  { id: "contract", title: "Contract" },
  { id: "trainee", title: "Trainee" },
];

export const noManagerOption = { id: "", title: "— None (top of chain) —" };

export const skillProficiencyOptions = [
  { id: "beginner", title: "Beginner" },
  { id: "intermediate", title: "Intermediate" },
  { id: "advanced", title: "Advanced" },
  { id: "expert", title: "Expert" },
];

export const skillTypeOptions = [
  { id: "technical", title: "Technical" },
  { id: "soft_skill", title: "Soft Skill" },
  { id: "language", title: "Language" },
];

export const salaryPaymentStatusOptions = [
  { id: "pending", title: "Pending" },
  { id: "processing", title: "Processing" },
  { id: "paid", title: "Paid" },
];

export const departmentStatusOptions = [
  { id: "Active", title: "department:status_active" },
  { id: "Inactive", title: "department:status_inactive" },
];

export const designationLevelOptions = [
  { id: "C-Level", title: "C-Level" },
  { id: "Director", title: "Director" },
  { id: "Manager", title: "Manager" },
  { id: "Supervisor", title: "Supervisor" },
  { id: "Staff", title: "Staff" },
  { id: "Intern", title: "Intern" },
];

export const designationLevelFilterOptions = [
  { id: "", title: "All Levels" },
  ...designationLevelOptions,
];

export const designationGradeOptions = [
  { id: "G-1", title: "Grade 1" },
  { id: "G-2", title: "Grade 2" },
  { id: "G-3", title: "Grade 3" },
  { id: "G-4", title: "Grade 4" },
  { id: "G-5", title: "Grade 5" },
];

export const attendanceStatusOptions = [
  { id: "Present", title: "attendance:present" },
  { id: "Absent", title: "attendance:absent" },
  { id: "Leave", title: "attendance:leave" },
  { id: "Holiday", title: "attendance:holiday" },
  { id: "Half-day", title: "attendance:half_day" },
];

export const attendanceStatusFilterOptions = [
  { id: "all", title: "attendance:all_status" },
  ...attendanceStatusOptions,
];

export const attendanceShiftOptions = [
  { id: "Day", title: "attendance:day" },
  { id: "Night", title: "attendance:night" },
  { id: "Flexible", title: "attendance:flexible" },
];

export const leaveStatusOptions = [
  { id: "Draft", title: "Draft" },
  { id: "Pending Manager", title: "Pending Manager" },
  { id: "Pending HR", title: "Pending HR" },
  { id: "Approved", title: "Approved" },
  { id: "Rejected", title: "Rejected" },
  { id: "Cancelled", title: "Cancelled" },
];

export const leaveStatusBadge = {
  "Pending Manager": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Pending HR": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

export const leaveStatusFilterOptions = [
  { id: "all", title: "All Status" },
  ...leaveStatusOptions,
];

export const leaveApplicableGenderOptions = [
  { id: "all", title: "All" },
  { id: "male", title: "Male Only" },
  { id: "female", title: "Female Only" },
];

export const leaveHalfDayOptions = [
  { id: "full", title: "Full Day" },
  { id: "first_half", title: "First Half" },
  { id: "second_half", title: "Second Half" },
];

export const loanTypeOptions = [
  { id: "Advance Salary", title: "loans:advance_salary" },
  { id: "EMI Loan", title: "loans:emi_loan" },
];

export const loanTypeFilterOptions = [
  { id: "all", title: "loans:all_types" },
  ...loanTypeOptions,
];

export const loanPurposeOptions = [
  { id: "House", title: "loans:house" },
  { id: "Vehicle", title: "loans:vehicle" },
  { id: "Personal", title: "loans:personal" },
  { id: "Education", title: "loans:education" },
  { id: "Medical", title: "loans:medical" },
];

export const loanStatusFilterOptions = [
  { id: "all", title: "loans:all_status" },
  { id: "Pending Manager", title: "requests:step_manager" },
  { id: "Pending HR", title: "requests:step_hr" },
  { id: "Pending", title: "loans:pending" },
  { id: "Approved", title: "loans:approved" },
  { id: "Ongoing", title: "loans:ongoing" },
  { id: "Completed", title: "loans:completed" },
];

export const jobStatusOptions = [
  { id: "Open", title: "Open" },
  { id: "On Hold", title: "On Hold" },
  { id: "Closed", title: "Closed" },
];

export const recruitmentStageOptions = [
  { id: "Applied", title: "Applied" },
  { id: "Screening", title: "Screening" },
  { id: "Interview", title: "Interview" },
  { id: "Offer", title: "Offer" },
  { id: "Hired", title: "Hired" },
  { id: "Rejected", title: "Rejected" },
];

export const jobExperienceOptions = [
  { id: "0–1 years", title: "0–1 years" },
  { id: "1+ years", title: "1+ years" },
  { id: "2+ years", title: "2+ years" },
  { id: "3+ years", title: "3+ years" },
  { id: "5+ years", title: "5+ years" },
  { id: "7+ years", title: "7+ years" },
];

export const appraisalStatusOptions = [
  { id: "Draft", title: "Draft" },
  { id: "Submitted", title: "Submitted" },
  { id: "Under Review", title: "Under Review" },
  { id: "Finalized", title: "Finalized" },
];

export const appraisalCycleOptions = [
  { id: "Q1", title: "Q1 (Jan–Mar)" },
  { id: "Q2", title: "Q2 (Apr–Jun)" },
  { id: "Q3", title: "Q3 (Jul–Sep)" },
  { id: "Q4", title: "Q4 (Oct–Dec)" },
  { id: "Annual", title: "Annual" },
  { id: "H1", title: "H1 (Jan–Jun)" },
  { id: "H2", title: "H2 (Jul–Dec)" },
];

export const kpiCategoryOptions = [
  { id: "Productivity", title: "Productivity" },
  { id: "Quality", title: "Quality" },
  { id: "Collaboration", title: "Collaboration" },
  { id: "Initiative", title: "Initiative" },
  { id: "Attendance", title: "Attendance" },
  { id: "Innovation", title: "Innovation" },
  { id: "Leadership", title: "Leadership" },
  { id: "Customer Focus", title: "Customer Focus" },
];

export const exitTypeOptions = [
  { id: "Resignation", title: "Resignation" },
  { id: "Retirement", title: "Retirement" },
  { id: "Termination", title: "Termination" },
  { id: "Absconding", title: "Absconding" },
  { id: "Contract End", title: "Contract End" },
];

export const exitStatusOptions = [
  { id: "Notice Period", title: "Notice Period" },
  { id: "Clearance", title: "Clearance" },
  { id: "Settlement", title: "Settlement" },
  { id: "Completed", title: "Completed" },
  { id: "Cancelled", title: "Cancelled" },
];

export const exitStatusFilterOptions = [
  { id: "", title: "All Status" },
  ...exitStatusOptions,
];

// Exit lifecycle enum + badge (Offboarding pages).
export const EXIT_STATUS = {
  NOTICE_PERIOD: "Notice Period",
  CLEARANCE: "Clearance",
  SETTLEMENT: "Settlement",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EXIT_STATUS_BADGE = {
  "Notice Period": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Clearance: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Settlement: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const CLEARANCE_SECTIONS = ["assets", "finance", "it", "manager"];

export const CLEARANCE_LABELS = {
  assets: "Assets",
  finance: "Finance",
  it: "IT",
  manager: "Manager",
};

export const exitInterviewReasonOptions = [
  { id: "Better Opportunity", title: "Better Opportunity" },
  { id: "Compensation", title: "Compensation" },
  { id: "Career Growth", title: "Career Growth" },
  { id: "Work-Life Balance", title: "Work-Life Balance" },
  { id: "Management / Culture", title: "Management / Culture" },
  { id: "Relocation", title: "Relocation" },
  { id: "Retirement", title: "Retirement" },
  { id: "Contract End", title: "Contract End" },
  { id: "Other", title: "Other" },
];

export const wouldRehireOptions = [
  { id: "Yes", title: "Yes" },
  { id: "No", title: "No" },
  { id: "Maybe", title: "Maybe" },
];

export const onboardingTaskCategoryOptions = [
  { id: "documentation", title: "Documentation" },
  { id: "it_access", title: "IT & Access" },
  { id: "workplace", title: "Workplace Setup" },
  { id: "payroll", title: "Payroll & Compliance" },
  { id: "orientation", title: "Orientation" },
];

export const ONBOARDING_STATUS = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const payrollRunStatusOptions = [
  { id: "Draft", title: "Draft" },
  { id: "Pending Approval", title: "Pending Approval" },
  { id: "Approved", title: "Approved" },
  { id: "Processing", title: "Processing" },
  { id: "Paid", title: "Paid" },
  { id: "Cancelled", title: "Cancelled" },
];

// Payroll run / special-payment lifecycle enums + badges.
export const RUN_STATUS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const RUN_STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Processing: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const SP_STATUS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const SP_STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const payrollRunStatusFilterOptions = [
  { id: "all", title: "All Status" },
  ...payrollRunStatusOptions,
];

export const specialPaymentStatusOptions = [
  { id: "Draft", title: "Draft" },
  { id: "Pending Approval", title: "Pending Approval" },
  { id: "Approved", title: "Approved" },
  { id: "Paid", title: "Paid" },
  { id: "Cancelled", title: "Cancelled" },
];

export const specialPaymentStatusFilterOptions = [
  { id: "all", title: "payroll:all" },
  ...specialPaymentStatusOptions,
];

export const specialPaymentTargetOptions = [
  { id: "all", title: "payroll:sp_target_all" },
  { id: "department", title: "payroll:sp_target_department" },
  { id: "individual", title: "payroll:sp_target_individual" },
  { id: "custom", title: "payroll:sp_target_custom" },
];

export const specialPaymentModeOptions = [
  { id: "fixed", title: "Fixed" },
  { id: "pct_basic", title: "% of Basic" },
  { id: "pct_gross", title: "% of Gross" },
];

export const pfWithdrawalTypeOptions = [
  { id: "Partial", title: "Partial" },
  { id: "Full", title: "Full (Settlement)" },
];

export const pfStatusFilterOptions = [
  { id: "all", title: "pf:all" },
  { id: "Active", title: "pf:active" },
  { id: "Inactive", title: "pf:inactive" },
];

export const announcementCategoryOptions = [
  { id: "General", title: "General" },
  { id: "Policy", title: "Policy" },
  { id: "Event", title: "Event" },
  { id: "Urgent", title: "Urgent" },
];

export const announcementCategoryFilterOptions = [
  { id: "", title: "hrhub:all_categories" },
  ...announcementCategoryOptions,
];

export const ANN_CATEGORY_BADGE = {
  General: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  Policy: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Event: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const holidayTypeOptions = [
  { id: "Public", title: "Public" },
  { id: "Company", title: "Company" },
  { id: "Optional", title: "Optional" },
];

export const holidayTypeFilterOptions = [
  { id: "", title: "hrhub:all_types" },
  ...holidayTypeOptions,
];

export const HOLIDAY_TYPE_BADGE = {
  Public: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Company: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Optional: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export const requestDocumentTypeOptions = [
  { id: "Salary Certificate", title: "Salary Certificate" },
  { id: "Experience Letter", title: "Experience Letter" },
  { id: "NOC", title: "NOC" },
  { id: "Employment Verification", title: "Employment Verification" },
  { id: "Bank Account Letter", title: "Bank Account Letter" },
];

export const probationOutcomeOptions = [
  { id: "Confirm", title: "Confirm" },
  { id: "Extend", title: "Extend" },
  { id: "Terminate", title: "Terminate" },
];

export const promotionChangeTypeOptions = [
  { id: "Promotion", title: "Promotion" },
  { id: "Increment", title: "Increment" },
  { id: "Transfer", title: "Transfer" },
];

export const shortLeaveTypeOptions = [
  { id: "Early Out", title: "Early Out" },
  { id: "Late Arrival", title: "Late Arrival" },
  { id: "Gate Pass", title: "Gate Pass" },
];

export const requestShiftTypeOptions = [
  { id: "Day", title: "Day" },
  { id: "Night", title: "Night" },
  { id: "Morning", title: "Morning" },
  { id: "Evening", title: "Evening" },
  { id: "Rotational", title: "Rotational" },
];

export const requestAssetTypeOptions = [
  { id: "Laptop", title: "Laptop" },
  { id: "Desktop", title: "Desktop" },
  { id: "Monitor", title: "Monitor" },
  { id: "Phone", title: "Phone" },
  { id: "SIM Card", title: "SIM Card" },
  { id: "Access Card", title: "Access Card" },
  { id: "Furniture", title: "Furniture" },
  { id: "Other", title: "Other" },
];

export const profileFieldOptions = [
  { id: "Phone Number", title: "Phone Number" },
  { id: "Address", title: "Address" },
  { id: "Bank Account", title: "Bank Account" },
  { id: "Emergency Contact", title: "Emergency Contact" },
  { id: "Marital Status", title: "Marital Status" },
  { id: "Email", title: "Email" },
];

export const grievanceCategoryOptions = [
  { id: "Workplace", title: "Workplace" },
  { id: "Harassment", title: "Harassment" },
  { id: "Payroll", title: "Payroll" },
  { id: "Management", title: "Management" },
  { id: "Facilities", title: "Facilities" },
  { id: "Other", title: "Other" },
];

export const disciplinaryTypeOptions = [
  { id: "Verbal Warning", title: "Verbal Warning" },
  { id: "Written Warning", title: "Written Warning" },
  { id: "Final Warning", title: "Final Warning" },
  { id: "Suspension", title: "Suspension" },
];

export const helpdeskCategoryOptions = [
  { id: "IT Support", title: "IT Support" },
  { id: "Facilities", title: "Facilities" },
  { id: "Payroll", title: "Payroll" },
  { id: "Access / Security", title: "Access / Security" },
  { id: "Other", title: "Other" },
];

export const helpdeskPriorityOptions = [
  { id: "Low", title: "Low" },
  { id: "Medium", title: "Medium" },
  { id: "High", title: "High" },
  { id: "Urgent", title: "Urgent" },
];


export const coaAccountTypeOptions = [
  { id: "Asset", title: "finance:type_asset" },
  { id: "Liability", title: "finance:type_liability" },
  { id: "Equity", title: "finance:type_equity" },
  { id: "Revenue", title: "finance:type_revenue" },
  { id: "Expense", title: "finance:type_expense" },
];

export const coaAccountTypeFilterOptions = [
  { id: "All", title: "All" },
  ...coaAccountTypeOptions.map((o) => ({ id: o.id, title: o.id })),
];

export const coaAccountTypeBadge = {
  Asset: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Liability: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Equity: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Revenue: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Expense: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};

export const coaAccountSubTypeOptions = [
  { id: "current_asset", title: "Current Asset", forTypes: ["Asset"] },
  { id: "fixed_asset", title: "Fixed Asset", forTypes: ["Asset"] },
  { id: "vat_receivable", title: "VAT Receivable", forTypes: ["Asset"] },
  { id: "current_liability", title: "Current Liability", forTypes: ["Liability"] },
  { id: "long_term_liability", title: "Long-Term Liability", forTypes: ["Liability"] },
  { id: "vat_payable", title: "VAT Payable", forTypes: ["Liability"] },
  { id: "retained_earnings", title: "Retained Earnings", forTypes: ["Equity"] },
  { id: "other_equity", title: "Other Equity", forTypes: ["Equity"] },
  { id: "operating_revenue", title: "Operating Revenue", forTypes: ["Revenue"] },
  { id: "other_revenue", title: "Other Revenue", forTypes: ["Revenue"] },
  { id: "cogs", title: "Cost of Goods Sold", forTypes: ["Expense"] },
  { id: "operating_expense", title: "Operating Expense", forTypes: ["Expense"] },
  { id: "tax_expense", title: "Tax Expense", forTypes: ["Expense"] },
];

export const coaAccountStatusOptions = [
  { id: "Active", title: "product:status_active" },
  { id: "Inactive", title: "product:status_inactive" },
];

export const bankAccountTypeOptions = [
  { id: "Bank", title: "Bank" },
  { id: "Cash", title: "Cash" },
];

export const bankTxTypeOptions = [
  { id: "deposit", title: "finance:tx_deposit" },
  { id: "withdrawal", title: "finance:tx_withdrawal" },
  { id: "bank_charge", title: "finance:tx_bank_charge" },
];

export const financePaymentDirectionOptions = [
  { id: "receipt", title: "finance:receipt" },
  { id: "disbursement", title: "finance:disbursement" },
];

export const financeJournalStatusBadge = {
  Posted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
};

export const financeReconciliationStatusBadge = {
  Reconciled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Open: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export const monthShortLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const agingBucketLabels = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];

export const expiryBucketOrder = [
  "expired",
  "within_1_month",
  "within_6_months",
  "within_1_year",
];

export const agingReportTypeOptions = [
  { id: "AR", title: "AR" },
  { id: "AP", title: "AP" },
];

export const userRoleStatusOptions = [
  { id: "active", title: "active", pill: "bg-emerald-100 text-emerald-700" },
  { id: "inactive", title: "inactive", pill: "bg-red-100 text-red-600" },
];

export const settingsTaxTypeOptions = [
  { id: "VAT", title: "VAT" },
  { id: "Withholding", title: "Withholding Tax" },
  { id: "Customs", title: "Customs / Import Duty" },
  { id: "Exempt", title: "Exempt" },
];

export const settingsCurrencyOptions = [
  { id: "SAR", title: "SAR — Saudi Riyal" },
  { id: "USD", title: "USD — US Dollar" },
  { id: "EUR", title: "EUR — Euro" },
  { id: "AED", title: "AED — UAE Dirham" },
  { id: "GBP", title: "GBP — British Pound" },
  { id: "EGP", title: "EGP — Egyptian Pound" },
  { id: "KWD", title: "KWD — Kuwaiti Dinar" },
];

export const settingsDateFormatOptions = [
  { id: "DD/MM/YYYY", title: "DD/MM/YYYY" },
  { id: "MM/DD/YYYY", title: "MM/DD/YYYY" },
  { id: "YYYY-MM-DD", title: "YYYY-MM-DD" },
];

export const settingsTimezoneOptions = [
  { id: "Asia/Riyadh", title: "Asia/Riyadh (UTC+3)" },
  { id: "Asia/Dubai", title: "Asia/Dubai (UTC+4)" },
  { id: "Asia/Amman", title: "Asia/Amman (UTC+2)" },
  { id: "Europe/London", title: "Europe/London (UTC+0)" },
  { id: "UTC", title: "UTC" },
];

export const settingsLanguageOptions = [
  { id: "en", title: "English" },
  { id: "ar", title: "Arabic" },
];

export const settingsTimeFormatOptions = [
  { id: "12h", title: "12-hour" },
  { id: "24h", title: "24-hour" },
];

export const businessCategoryOptions = [
  { id: "Retail", title: "Retail" },
  { id: "F&B", title: "Food & Beverage" },
  { id: "E-Commerce", title: "E-Commerce" },
  { id: "Healthcare", title: "Healthcare" },
  { id: "Travel", title: "Travel" },
  { id: "Education", title: "Education" },
  { id: "Real Estate", title: "Real Estate" },
  { id: "Technology", title: "Technology" },
  { id: "Other", title: "Other" },
];

export const merchantStatusFilterOptions = [
  { id: "all", title: "merchant:all_statuses" },
  { id: "active", title: "Active" },
  { id: "inactive", title: "Inactive" },
];

export const adminRoleOptions = [
  { id: "Admin", title: "Admin" },
  { id: "Super Admin", title: "Super Admin" },
];
