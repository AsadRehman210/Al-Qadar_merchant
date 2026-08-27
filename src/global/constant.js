import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { BiCategoryAlt } from "react-icons/bi";
import {
  Users,
  DollarSign,
  FileText,
  User,
  Home,
  Shield,
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
  UserCheck,
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
  CalendarOff,
  Calculator,
  BadgeDollarSign,
  HandCoins,
  Stamp,
  PackageSearch,
  ScanLine,
  SlidersHorizontal,
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
  PackageCheck,
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
  view_employee,
  add_employee,
  edit_employee,
  delete_employee,
} = rafeeqi_role_ids;
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
    role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
    items: [
      {
        name: "Talent & Lifecycle",
        nameKey: "sidebar_grp_talent",
        icon: Sparkles,
        role: `${view_employee},${view_user}`,
        children: [
          {
            name: "Recruitment",
            nameKey: "sidebar_recruitment",
            href: "/recruitment",
            icon: BriefcaseIcon,
            role: `${view_employee},${view_user}`,
          },
          {
            name: "Onboarding",
            nameKey: "sidebar_onboarding",
            href: "/onboarding",
            icon: UserPlus,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Performance",
            nameKey: "sidebar_performance",
            href: "/performance",
            icon: Star,
            role: `${view_employee},${view_user}`,
          },
          {
            name: "Offboarding",
            nameKey: "sidebar_offboarding",
            href: "/offboarding",
            icon: UserMinus,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
        ],
      },
      {
        name: "Organization",
        nameKey: "sidebar_grp_organization",
        icon: LayoutGrid,
        role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
        children: [
          {
            name: "Departments",
            nameKey: "sidebar_departments",
            href: "/departments",
            icon: FolderTree,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Employees",
            nameKey: "sidebar_employees",
            href: "/employees",
            icon: Briefcase,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Designations",
            nameKey: "sidebar_designations",
            href: "/designations",
            icon: Award,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Org Chart",
            nameKey: "sidebar_org_chart",
            href: "/org-chart",
            icon: Network,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Compliance",
            nameKey: "sidebar_compliance",
            href: "/compliance",
            icon: ShieldAlert,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
        ],
      },
      {
        name: "Time & Attendance",
        nameKey: "sidebar_grp_time_attendance",
        icon: CalendarClock,
        role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
        children: [
          {
            name: "Attendance",
            nameKey: "sidebar_attendance",
            href: "/attendance",
            icon: UserCheck,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Leave Management",
            nameKey: "sidebar_leave_management",
            href: "/leave-management",
            icon: CalendarOff,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Holiday Calendar",
            nameKey: "sidebar_holiday_calendar",
            href: "/holiday-calendar",
            icon: CalendarDays,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Attendance Policies",
            nameKey: "sidebar_attendance_policies",
            href: "/attendance-policy",
            icon: FileCheck,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
        ],
      },
      {
        name: "Payroll & Benefits",
        nameKey: "sidebar_grp_payroll",
        icon: Banknote,
        role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
        children: [
          {
            name: "Salary",
            nameKey: "sidebar_salary",
            href: "/salary",
            icon: DollarSign,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Payroll Processing",
            nameKey: "sidebar_payroll_batch",
            href: "/payroll-batch",
            icon: Calculator,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Provident Fund",
            nameKey: "sidebar_provident_fund",
            href: "/provident-fund",
            icon: PiggyBank,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Special Payments",
            nameKey: "sidebar_special_payments",
            href: "/special-payments",
            icon: BadgeDollarSign,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Loans",
            nameKey: "sidebar_loans",
            href: "/loans",
            icon: FileText,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "Expenses",
            nameKey: "sidebar_expenses",
            href: "/expenses",
            icon: HandCoins,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
        ],
      },
      {
        name: "Requests & Approvals",
        nameKey: "sidebar_grp_requests",
        icon: Inbox,
        role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
        children: [
          {
            name: "Employee Requests",
            nameKey: "sidebar_requests",
            href: "/requests",
            icon: ClipboardList,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
          {
            name: "My Approvals",
            nameKey: "sidebar_my_approvals",
            href: "/my-approvals",
            icon: Stamp,
            role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
          },
        ],
      },
      {
        name: "Announcements",
        nameKey: "sidebar_announcements",
        href: "/announcements",
        icon: Megaphone,
        role: `${view_employee},${add_employee},${edit_employee},${delete_employee},${view_user}`,
      },
    ],
  },
  {
    title: "Asset Management",
    titleKey: "sidebar_asset_management",
    icon: Archive,
    role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
    items: [
      {
        name: "Assets",
        nameKey: "sidebar_assets_register",
        href: "/assets",
        icon: HardDrive,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Asset categories",
        nameKey: "sidebar_asset_categories",
        href: "/assets-categories",
        icon: Tags,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Asset requests",
        nameKey: "sidebar_asset_requests",
        href: "/assets/requests",
        icon: PackageSearch,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Asset audits",
        nameKey: "sidebar_asset_audits",
        href: "/assets/audits",
        icon: ScanLine,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Asset reports",
        nameKey: "sidebar_asset_reports",
        href: "/assets/reports",
        icon: BarChart3,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
    ],
  },
  {
    title: "Products & Inventory",
    titleKey: "sidebar_products_inventory",
    icon: Package2,
    role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
    items: [
      {
        name: "Categories",
        nameKey: "sidebar_categories",
        href: "/inventory/categories",
        icon: BiCategoryAlt,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Products",
        nameKey: "sidebar_products",
        href: "/inventory/products",
        icon: Boxes,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Variants",
        nameKey: "sidebar_variants",
        href: "/inventory/variants",
        icon: Layers,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Stock",
        nameKey: "sidebar_stock",
        href: "/inventory/stock",
        icon: PackageCheck,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Production",
        nameKey: "sidebar_production",
        href: "/inventory/production",
        icon: Factory,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Stock Adjustment",
        nameKey: "sidebar_stock_adjust",
        href: "/inventory/stock/adjust",
        icon: SlidersHorizontal,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
    ],
  },
  {
    title: "Warehouse",
    titleKey: "sidebar_warehouse",
    icon: Warehouse,
    role: `${view_user}`,
    items: [
      { name: "Warehouses",       nameKey: "sidebar_warehouses",      href: "/warehouse",            icon: Warehouse, role: `${view_user}` },
      { name: "Stock Transfers",  nameKey: "sidebar_stock_transfers",  href: "/warehouse_transfers",  icon: GitMerge,  role: `${view_user}` },
      { name: "Stock Issues",     nameKey: "sidebar_stock_issues",     href: "/warehouse_issues",     icon: PackageMinus, role: `${view_user}` },
    ],
  },
  {
    title: "Clients & Vendors",
    titleKey: "sidebar_clients_vendors",
    icon: Store,
    role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
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
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Sales",
        nameKey: "sidebar_sales_item",
        href: "/sales",
        icon: Receipt,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Quotations",
        nameKey: "sidebar_quotations",
        href: "/quotation",
        icon: FilePenLine,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Credit Notes",
        nameKey: "sidebar_credit_notes",
        href: "/credit-notes",
        icon: FileMinus,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Purchases",
        nameKey: "sidebar_purchases_item",
        href: "/purchases",
        icon: ShoppingCart,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Debit Notes",
        nameKey: "sidebar_debit_notes",
        href: "/debit-notes",
        icon: FilePlus,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
    ],
  },
  {
    title: "Finance Management",
    titleKey: "sidebar_finance_management",
    icon: Landmark,
    role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
    items: [
      {
        name: "Chart of Accounts",
        nameKey: "sidebar_finance_coa",
        href: "/finance/coa",
        icon: PieChart,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Ledger",
        nameKey: "sidebar_finance_ledger",
        href: "/finance/ledger",
        icon: BookMarked,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Journal entries",
        nameKey: "sidebar_finance_journal",
        href: "/finance/journal",
        icon: NotebookPen,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Accounts Receivable",
        nameKey: "sidebar_finance_ar",
        href: "/finance/receivable",
        icon: CircleArrowDown,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Accounts Payable",
        nameKey: "sidebar_finance_ap",
        href: "/finance/payable",
        icon: CircleArrowUp,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Expense management",
        nameKey: "sidebar_finance_expenses_module",
        href: "/finance/expenses",
        icon: Wallet,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Income / Revenue",
        nameKey: "sidebar_finance_income",
        href: "/finance/income",
        icon: TrendingUp,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Payments",
        nameKey: "sidebar_finance_payments",
        href: "/finance/payments",
        icon: Banknote,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Bank & Cash",
        nameKey: "sidebar_finance_bank",
        href: "/finance/bank-cash",
        icon: Coins,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Financial reports",
        nameKey: "sidebar_finance_reports",
        href: "/finance/reports",
        icon: LineChart,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Bank Reconciliation",
        nameKey: "sidebar_finance_reconciliation",
        href: "/finance/bank-reconciliation",
        icon: CheckSquare,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Recoverable Tax",
        nameKey: "sidebar_finance_recoverable_tax",
        href: "/finance/recoverable-tax",
        icon: Undo2,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Collected Tax",
        nameKey: "sidebar_finance_collected_tax",
        href: "/finance/collected-tax",
        icon: BadgePercent,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
      {
        name: "Tax Payment",
        nameKey: "sidebar_finance_tax_payment",
        href: "/finance/tax-payment",
        icon: CreditCard,
        role: `${view_customer},${add_customer},${edit_customer},${delete_customer}`,
      },
    ],
  },
  {
    title: "Reports",
    titleKey: "sidebar_reports",
    icon: BarChart2,
    role: `${view_user}`,
    items: [
      { name: "Reports Hub",      nameKey: "sidebar_reports_hub",     href: "/reports",              icon: BarChart2, role: `${view_user}` },
    ],
  },
  {
    title: "Settings",
    titleKey: "sidebar_settings_section",
    icon: Settings,
    role: `${view_user}`,
    items: [
      { name: "Settings",         nameKey: "sidebar_settings",        href: "/settings",             icon: Settings,  role: `${view_user}` },
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
    title: "sidebar_stock_adjust",
    url: "/inventory/stock/adjust",
    description: "Manual stock adjustment",
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

// Shared Pending/Partial/Cleared payment-status pill classes — Purchase
// Invoice and Sale Invoice both use this exact same three-value enum.
export const paymentStatusBadge = {
  Pending: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  Partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Cleared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
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
