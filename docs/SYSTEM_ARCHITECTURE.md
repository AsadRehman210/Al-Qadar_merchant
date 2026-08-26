# Business Management Platform — System Architecture & API Specification

**Status:** Draft for backend planning. No backend exists yet — this document defines the data model, tenancy rules, flows, and API endpoint surface so backend implementation can start directly from it.
**Audience:** Product, backend engineering, frontend engineering, QA.
**Author's lens:** written as product manager + full-stack engineer + UX designer + end user, reviewing for missing flows, not just happy paths.

---

## Table of contents

0. [Scope & decisions locked in](#0-scope--decisions-locked-in)
1. [Actors, portals & access model](#1-actors-portals--access-model)
2. [Tenant & ownership model](#2-tenant--ownership-model)
3. [Account provisioning & auth flows](#3-account-provisioning--auth-flows)
4. [RBAC — roles & permission matrix](#4-rbac--roles--permission-matrix)
5. [API design conventions](#5-api-design-conventions)
6. [Module: Admin & Merchant Management](#6-module-admin--merchant-management)
7. [Module: Platform Billing & Subscriptions](#7-module-platform-billing--subscriptions)
8. [Module: Employee Management (HR)](#8-module-employee-management-hr)
9. [Module: Asset Management](#9-module-asset-management)
10. [Module: Product Management](#10-module-product-management)
11. [Module: Client & Vendor Management](#11-module-client--vendor-management)
12. [Module: Warehouse Management](#12-module-warehouse-management)
13. [Module: Finance Management](#13-module-finance-management)
14. [Cross-module integration map](#14-cross-module-integration-map)
15. [Dashboard & reports](#15-dashboard--reports)
16. [Notifications & announcements](#16-notifications--announcements)
17. [Settings & feature flags](#17-settings--feature-flags)
18. [Audit log](#18-audit-log)
19. [Cron / scheduled jobs](#19-cron--scheduled-jobs)
20. [Missing-flow fixes — explicit gap log](#20-missing-flow-fixes--explicit-gap-log)
21. [Out of scope](#21-out-of-scope)
22. [Appendix: entity relationship summary](#22-appendix-entity-relationship-summary)

---

## 0. Scope & decisions locked in

This document covers six business modules — **Employee, Asset, Product, Client & Vendor, Finance, Warehouse management** — operated across three portals — **Super Admin, Admin, Merchant** — plus the cross-cutting systems (auth, RBAC, billing, notifications, audit, reports) needed to make them work as one coherent multi-tenant product.

Three architectural decisions were confirmed before writing this spec (they shape every section below):

1. **Admin has its own standalone business data**, in addition to managing Merchants. An Admin is not just an oversight layer — Admin can run its own Employees/Assets/Products/Customers/Finance/Warehouse independently of any Merchant it manages. Super Admin has the same, by the same mechanism (Super Admin is an Admin record with `role: SUPER_ADMIN`).
2. **Legacy travel-agency modules** (Agency, Driver, Vehicle, Booking, Package, Pricing, Kashaf, Lead, Opportunity, FAQ) already present in the codebase are **out of scope** for this architecture — see [§21](#21-out-of-scope).
3. **Platform subscription billing** (Super Admin bills Admins, Admin/Super Admin bills Merchants for platform usage) is documented as its **own module**, separate from each tenant's internal Finance Management (their own bookkeeping) — see [§7](#7-module-platform-billing--subscriptions) vs [§13](#13-module-finance-management).

---

## 1. Actors, portals & access model

| Portal | Who logs in | What they see |
|---|---|---|
| **Super Admin** | The platform operator (one org runs the whole platform). One or more Super Admin accounts. | Everything: every Admin, every Merchant (including merchants with no admin), platform billing, global reports, audit log, feature flags. |
| **Admin** | A reseller / regional operator / franchise-style tenant-owner created by Super Admin. | Their own standalone business data, plus every Merchant they created (or were assigned), plus their sub-users (Admin Staff). Cannot see other Admins or their merchants. |
| **Merchant** | The actual operating business — a shop, a company, a branch — created by an Admin or directly by Super Admin. | Only their own business data and their own sub-users (Merchant Staff/Employees). Cannot see their parent Admin's other merchants, and cannot see the Admin's own data. |

**No self-signup anywhere.** There is no public registration form for the Admin or Merchant portal. Every Admin and every Merchant account is created by the tier above, with credentials issued at creation time (see [§3](#3-account-provisioning--auth-flows)). The only "signup-like" UI in the system is the first-login forced password reset.

**A Merchant can exist with no Admin.** `Merchant.adminId` is nullable — when null, the merchant is owned directly by Super Admin. This mirrors "super admin ky apny merchants bi ho sakty hain" and is already partially modeled in the existing `MerchantManagement` fake data (`"— No Admin (Superadmin's merchant) —"` option).

**One login, three portals.** Email is unique across the entire platform (Admins, Merchants, and all their staff share one email namespace). `POST /api/auth/login` is a single endpoint; the backend resolves which portal/role the account belongs to and the frontend routes accordingly. No separate "which portal are you logging into" chooser — see [§3.1](#31-login).

---

## 2. Tenant & ownership model

This is the single most important section — every entity in every module below inherits it.

### 2.1 The `ownerScope` pattern

Every business record (an Employee, an Asset, a Product, a Customer, a Sale Invoice, a Ledger entry, a Warehouse — everything except the platform-level Admin/Merchant/Billing records themselves) carries:

```
ownerScope: {
  ownerType: "ADMIN" | "MERCHANT",
  ownerId:   ObjectId   // -> Admins._id  (if ownerType = ADMIN)
                        // -> Merchants._id (if ownerType = MERCHANT)
}
```

- `ownerType: "ADMIN"` — the record belongs to an Admin's own standalone operation. If that Admin's `role` is `SUPER_ADMIN`, this is the Super Admin's own operational data.
- `ownerType: "MERCHANT"` — the record belongs to a Merchant. The Merchant's own `adminId` field (nullable) determines which Admin (if any) manages it.

This is a flat two-level tag, not a deep tree — an Admin's data and "their" merchants' data are siblings, not parent/child records. An Admin managing 5 merchants sees **6 separate data silos** (their own + 5 merchants'), never merged unless a report explicitly aggregates them.

### 2.2 Visibility rules

| Requester | Can read/write |
|---|---|
| Super Admin | Everything, everywhere. No `ownerScope` filter applied. Can also act as themself (`ownerType=ADMIN, ownerId=<their own admin id>`) for their personal operational data. |
| Admin | `ownerType=ADMIN, ownerId=self` (their own data) **and** `ownerType=MERCHANT, ownerId=<merchant._id>` for every Merchant where `Merchant.adminId = self`. Nothing else. |
| Admin Staff (sub-user) | Same as their parent Admin, further filtered by their own granted permissions (see [§4](#4-rbac--roles--permission-matrix)). |
| Merchant | `ownerType=MERCHANT, ownerId=self` only. |
| Merchant Staff (sub-user) | Same as their parent Merchant, further filtered by permissions. |

**This is enforced server-side on every query, not client-side.** The backend derives `ownerScope` from the authenticated session — it is never accepted as a client-supplied field on create/update, and it is never trusted from a request body. The one exception is Admin/Super-Admin drill-down endpoints, where `merchantId`/`adminId` is a **path parameter** validated against the authenticated user's actual management relationship before any query runs (see [§5.2](#52-drill-down--impersonation-scoped-access)).

### 2.3 Re-parenting a merchant

A Merchant's `adminId` can change (Super Admin reassigns a merchant to a different Admin, or detaches it to become Super Admin's own). This does **not** rewrite `ownerId` on the merchant's business records — they stay `ownerType=MERCHANT, ownerId=<merchant._id>` regardless of who manages the merchant, since the merchant's *own* data never moves. Only visibility (via the `adminId` lookup) changes. See [§6.4](#64-flow-re-parenting-a-merchant).

---

## 3. Account provisioning & auth flows

### 3.1 Login

Single entry point for all three portals:

```
POST /api/auth/login
Body: { email, password }
Response: {
  token, refreshToken,
  account: {
    id, name, email,
    tier: "ADMIN" | "MERCHANT",      // which base table the account is in
    role: "SUPER_ADMIN" | "ADMIN" | "ADMIN_STAFF" | "MERCHANT_OWNER" | "MERCHANT_STAFF",
    ownerScope: { ownerType, ownerId },  // what this account's own data is scoped to
    permissions: [ "employee.view", "asset.create", ... ],
    mustChangePassword: boolean
  }
}
```

Frontend routes to the Super Admin / Admin / Merchant shell purely off `role`. If `mustChangePassword` is true, the only reachable screen is the forced password-change form — every other route redirects there.

### 3.2 Flow: Super Admin creates an Admin

1. Super Admin fills Add Admin form (name, email, phone, company, country/city, plan selection).
2. `POST /api/super-admin/v1/admins` — backend generates a temporary password, creates the Admin record with `mustChangePassword: true`, `status: "Active"`.
3. Backend sends the temp password via email (and/or SMS) — **this email step does not exist in the current fake-data build and must be a real transactional email in the backend.**
4. Admin logs in with temp password → forced to `POST /api/auth/change-password` before reaching any other screen.
5. `POST /api/super-admin/v1/admins` also creates the Admin's first Platform Billing subscription record per the selected plan (see [§7](#7-module-platform-billing--subscriptions)).

### 3.3 Flow: Admin (or Super Admin) creates a Merchant

Same shape as 3.2, via `POST /api/admin/v1/merchants` (adminId implicit = creator) or `POST /api/super-admin/v1/merchants` (Super Admin can set `adminId: null` for a direct merchant, or assign to any admin).

### 3.4 Flow: creating a Staff sub-user (Admin Staff / Merchant Staff)

Staff accounts are **Employee records with portal access granted** — this reuses the Employee module instead of inventing a parallel "Users" table (see [§8.5](#85-employee-as-a-portal-user)).

1. Admin (or Merchant) creates an Employee record as normal.
2. On that Employee's detail page, toggles "Grant portal access" → picks a role (e.g. `ADMIN_STAFF` + a permission set, or a merchant-side role like `MERCHANT_STAFF` + permission set).
3. `POST /api/{admin|merchant}/v1/employees/:id/grant-access` — backend creates login credentials (temp password, same email flow as 3.2), sets `Employee.portalAccess = { enabled: true, role, permissions[] }`.
4. Revoking access (`POST .../revoke-access`) disables login without deleting the HR record — an ex-staff-member's HR/payroll history is preserved.

### 3.5 Flow: forgot password

**Gap fix — this flow is entirely missing from the current build** (no self-signup means the platform must be the only path back in). `POST /api/auth/forgot-password { email }` → email with a signed, expiring reset link → `POST /api/auth/reset-password { token, newPassword }`. Applies identically to Admin, Admin Staff, Merchant, Merchant Staff.

### 3.6 Flow: suspending an account

- Suspending an **Admin** blocks that Admin (and their Admin Staff) from logging in and freezes their own standalone data as read-only-by-Super-Admin-only. **Their Merchants keep operating normally** — a merchant's day-to-day business (sales, payroll, stock) must not halt because their reseller's account was suspended for a billing dispute. Super Admin gets a dashboard flag "N merchants under a suspended admin."
- Suspending a **Merchant** blocks that merchant and all its Merchant Staff immediately — no partial mode.
- Suspension never deletes data. Reactivation restores access with no data loss.

---

## 4. RBAC — roles & permission matrix

### 4.1 Roles

| Role | Tier | Notes |
|---|---|---|
| `SUPER_ADMIN` | Admin | Unrestricted. Cannot be permission-limited. |
| `ADMIN` | Admin | Full access to their own `ownerScope` and every merchant they manage, minus anything explicitly reserved for Super Admin. |
| `ADMIN_STAFF` | Admin | An Employee with granted access; permission set assigned per-employee, scoped to their Admin's `ownerScope`. |
| `MERCHANT_OWNER` | Merchant | Full access within their own `ownerScope`. |
| `MERCHANT_STAFF` | Merchant | An Employee with granted access; permission set assigned per-employee, scoped to their Merchant's `ownerScope`. |

### 4.2 Permission naming convention

`{module}.{action}` — e.g. `employee.view`, `employee.create`, `employee.edit`, `employee.delete`, `employee.approve_leave`, `finance.post_journal`, `asset.assign`. Every module below lists its permission keys next to its endpoint table. This replaces the current build's bug where most modules are gated on the wrong (`Customer`) permission ids — every module gets its own real permission keys.

### 4.3 Module-level access matrix (who can even open the module)

| Module | Super Admin | Admin (own data) | Admin (managing a merchant) | Merchant Owner | Merchant Staff |
|---|:---:|:---:|:---:|:---:|:---:|
| Employee Management | ✅ | ✅ | ✅ (per permission) | ✅ | per permission |
| Asset Management | ✅ | ✅ | ✅ | ✅ | per permission |
| Product Management | ✅ | ✅ | ✅ | ✅ | per permission |
| Client & Vendor Management | ✅ | ✅ | ✅ | ✅ | per permission |
| Warehouse Management | ✅ | ✅ | ✅ | ✅ | per permission |
| Finance Management | ✅ | ✅ | ✅ | ✅ | per permission |
| Admin & Merchant Management | ✅ full | ✅ merchants only | — | — | — |
| Platform Billing | ✅ full | ✅ own + merchants (read + pay) | — | ✅ own (read + pay) | — |
| Reports | ✅ platform-wide | ✅ own + merchants rollup | — | ✅ own | per permission |
| Audit Log | ✅ full | ✅ own scope only | — | ✅ own scope only | — |
| Settings / feature flags | ✅ full | ✅ own scope | — | ✅ own scope, within plan limits | — |

"Per permission" cells mean: the module is reachable, but individual actions (view/create/edit/delete/approve) are gated per the Employee's `portalAccess.permissions[]`.

---

## 5. API design conventions

### 5.1 Base prefixes

```
/api/auth/*                        — shared login/password (no tenant scope)
/api/super-admin/v1/*               — Super Admin exclusive
/api/admin/v1/*                     — Admin's own data + merchant management, adminId implicit from token
/api/merchant/v1/*                  — Merchant's own data, merchantId implicit from token
```

Every module below (Employee, Asset, Product, Client & Vendor, Warehouse, Finance) is mounted under **all three** of `/api/admin/v1/...`, `/api/merchant/v1/...`, and nested under Super Admin's drill-down — rather than repeat three near-identical tables per module, each module section lists the **Merchant-portal** path (the canonical, most detailed form) and this section defines the mapping once:

| Acting as | Path pattern | `ownerScope` used |
|---|---|---|
| Merchant (own data) | `/api/merchant/v1/{module}` | `MERCHANT`, self |
| Admin (own standalone data) | `/api/admin/v1/{module}` | `ADMIN`, self |
| Admin, managing one of their merchants | `/api/admin/v1/merchants/:merchantId/{module}` | `MERCHANT`, `:merchantId` (must satisfy `Merchant.adminId = requester`) |
| Super Admin, managing a specific admin's own data | `/api/super-admin/v1/admins/:adminId/{module}` | `ADMIN`, `:adminId` |
| Super Admin, managing any merchant | `/api/super-admin/v1/merchants/:merchantId/{module}` | `MERCHANT`, `:merchantId` |

`{module}` = `employees`, `assets`, `products`, `customers`, `warehouses`, `finance/ledger`, etc., matching each module's own path segments below.

### 5.2 Drill-down / impersonation-scoped access

Whenever a path carries an explicit `:adminId` or `:merchantId`, the backend must, on every request:
1. Confirm the authenticated user's tier/role is allowed to drill down at all (`ADMIN`/`SUPER_ADMIN` only — never `MERCHANT_*`).
2. If requester is `ADMIN`: confirm `Merchant.adminId === requester.id` for the target `:merchantId` (403 otherwise). Admins can never drill into `:adminId` paths (that's Super-Admin-only).
3. If requester is `SUPER_ADMIN`: no ownership check, any `:adminId`/`:merchantId` is reachable.

### 5.3 Standard CRUD shape

Unless a module section says otherwise, every listable entity gets:

| Method | Path | Description |
|---|---|---|
| `GET` | `/{module}` | List, paginated (`page`, `limit`), filterable (`status`, `search`, `sort`) |
| `GET` | `/{module}/:id` | Detail |
| `POST` | `/{module}` | Create |
| `PATCH` | `/{module}/:id` | Update (partial) |
| `DELETE` | `/{module}/:id` | **Soft delete** — sets `status: "Archived"`, never removes rows. Records with financial/stock history additionally block deletion outright (`409` with a reason) until superseded by an explicit "deactivate" instead. |

Only non-standard endpoints (status transitions, approvals, linked-record actions) are listed per module — plain CRUD rows above are implied for every entity and not repeated.

### 5.4 Response envelope & errors

```
Success: { success: true, data, meta? }
Error:   { success: false, error: { code, message, fields? } }
```
Validation errors return `422` with a `fields` map (`{ email: "Already in use" }`) — the frontend has consistently needed field-level messages throughout this build (`FormInput`'s error rendering), so the API contract should supply them natively rather than the frontend parsing a generic string.

---

## 6. Module: Admin & Merchant Management

*Super Admin and Admin only — Merchants never see this module.*

### 6.1 Data model

**Admin**
```
_id, adminCode, name, email, phone, passwordHash,
role: "ADMIN" | "SUPER_ADMIN",
status: "Active" | "Inactive" | "Suspended",
companyName, country, city, address,
mustChangePassword, twoFactorEnabled, lastLoginAt,
createdBy (Admin._id of the Super Admin who created this, null for the bootstrap Super Admin),
createdAt, updatedAt
```

**Merchant**
```
_id, merchantCode, name, email, phone, passwordHash,
businessCategory, adminId (nullable -> Admin._id),
status: "Active" | "Inactive" | "Suspended",
country, city, address, taxNumber, website,
mustChangePassword, lastLoginAt,
createdBy (Admin._id — the creator, may differ from adminId if Super Admin created it on an Admin's behalf),
createdAt, updatedAt
```

### 6.2 Endpoints

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET/POST/PATCH/DELETE` | `/api/super-admin/v1/admins` | Super Admin | Standard CRUD on Admins |
| `POST` | `/api/super-admin/v1/admins/:id/suspend` | Super Admin | Suspend (see §3.6) |
| `POST` | `/api/super-admin/v1/admins/:id/reactivate` | Super Admin | Reactivate |
| `POST` | `/api/super-admin/v1/admins/:id/reset-password` | Super Admin | Force-issue a new temp password |
| `GET` | `/api/super-admin/v1/admins/:id/merchants` | Super Admin | Merchants under this admin |
| `GET/POST/PATCH/DELETE` | `/api/admin/v1/merchants` | Admin | CRUD merchants **this admin owns** (`adminId` implicit = self) |
| `GET/POST/PATCH/DELETE` | `/api/super-admin/v1/merchants` | Super Admin | CRUD **any** merchant platform-wide (filterable by `adminId`, incl. `adminId=null`) |
| `POST` | `/api/{admin\|super-admin}/v1/merchants/:id/suspend` | Admin (own), Super Admin (any) | Suspend |
| `POST` | `/api/{admin\|super-admin}/v1/merchants/:id/reactivate` | Admin (own), Super Admin (any) | Reactivate |
| `POST` | `/api/super-admin/v1/merchants/:id/reassign` | Super Admin | Re-parent to a different `adminId` (or `null`) — see §6.4 |

### 6.3 Flow: creating an Admin/Merchant (UI happy path)

Add form → temp password auto-generated server-side (not typed by the creator — the current fake-data `AddAdmin`/`AddMerchant` forms have a manual password field; **gap fix**: this should not be a field a Super Admin/Admin types on someone else's behalf, it should be system-generated and emailed, both for security and because the creator shouldn't need to relay a password out-of-band) → record created with `mustChangePassword: true` → welcome email sent.

### 6.4 Flow: re-parenting a merchant

Super Admin reassigns `Merchant.adminId`. Effects:
- The merchant's own business records are untouched (see §2.3).
- The **old** admin loses visibility immediately; the **new** admin gains it.
- Platform billing for that merchant (§7) — who invoices whom — switches from the old admin's billing relationship to the new one (or to Super Admin directly if reassigned to `null`) starting the next billing cycle, not retroactively.
- An audit log entry and a notification to both the old and new admin are mandatory (§18, §16).

---

## 7. Module: Platform Billing & Subscriptions

*Distinct from Finance Management (§13) — this is the platform charging its own tenants for platform usage, not a tenant's internal bookkeeping.*

### 7.1 Data model

**SubscriptionPlan** (Super Admin-managed catalog)
```
_id, name, tier ("Starter" | "Growth" | "Enterprise" | ...),
billingCycle: "Monthly" | "Yearly",
price, currency,
moduleAccess: { employee: bool, asset: bool, product: bool, clientVendor: bool, warehouse: bool, finance: bool },
limits: { maxEmployees, maxWarehouses, maxUsers, storageGb, ... },
appliesTo: "ADMIN" | "MERCHANT" | "BOTH"
```

**Subscription** (one active per Admin or Merchant)
```
_id, ownerType: "ADMIN"|"MERCHANT", ownerId, planId,
status: "Active" | "PastDue" | "Suspended" | "Cancelled",
startDate, currentPeriodEnd, nextBillingDate,
billedBy: "SUPER_ADMIN" | Admin._id   // who invoices this subscriber — Super Admin bills Admins directly; a Merchant is billed by its adminId if set, else by Super Admin
```

**BillingInvoice** / **BillingPayment** — same shape as the existing `billingInvoices[]`/`receivedPayments[]` embedded arrays, promoted to first-class collections: `_id, subscriptionId, ownerType, ownerId, billedBy, periodStart, periodEnd, amount, currency, status ("Pending"|"Paid"|"Overdue"|"Cancelled"), dueDate, paidAt, paymentMethod, reference`.

### 7.2 Endpoints

| Method | Path | Roles | Description |
|---|---|---|---|
| CRUD | `/api/super-admin/v1/billing/plans` | Super Admin | Manage the plan catalog |
| `GET` | `/api/super-admin/v1/billing/subscriptions` | Super Admin | All subscriptions platform-wide |
| `POST` | `/api/super-admin/v1/billing/subscriptions/:id/change-plan` | Super Admin | Upgrade/downgrade |
| `GET` | `/api/{admin\|merchant}/v1/billing/subscription` | Admin, Merchant | Their own current subscription |
| `GET` | `/api/{admin\|merchant}/v1/billing/invoices` | Admin, Merchant | Their own invoice history |
| `POST` | `/api/{admin\|merchant}/v1/billing/invoices/:id/pay` | Admin, Merchant | Pay an invoice (gateway callback confirms) |
| `GET` | `/api/admin/v1/billing/merchants` | Admin | Roll-up of billing status across their merchants (who owes what) |
| `POST` | `/api/super-admin/v1/billing/invoices/:id/mark-paid` | Super Admin | Manual reconciliation (bank transfer, etc.) |

### 7.3 Flow: plan enforcement (feature gating)

**Gap fix — this flow does not exist today.** When a merchant/admin's active plan does not include a module (`moduleAccess.warehouse: false`), that module:
- Is hidden from the sidebar (frontend reads `subscription.plan.moduleAccess` at login and filters nav).
- Is hard-blocked server-side too (`403 MODULE_NOT_IN_PLAN`) — never rely on the frontend hiding a nav item as the only gate.
- Shows an upgrade prompt in place of the module, not a blank/broken page.

### 7.4 Flow: overdue billing → suspension (cron-driven)

See §19.1. `BillingInvoice.status` flips to `Overdue` past `dueDate`; after a configurable grace period (default 7 days) the cron auto-suspends the subscription → cascades to account suspension per §3.6.

---

## 8. Module: Employee Management (HR)

The largest module — reuses and formalizes the existing HR feature set (Employees, Departments, Designations, Org Chart, Attendance, Leave, Shifts, Payroll, Provident Fund, Special Payments, Loans, Expenses, Requests/Approvals, Onboarding, Offboarding, Recruitment, Performance, Announcements, Holiday Calendar, Compliance) under the tenant model.

### 8.1 Data model — core

```
Employee: _id, employeeId, ownerScope, name, email, phone, photo,
  departmentId, designationId, managerId (-> Employee._id),
  employmentType ("Full-time"|"Part-time"|"Contract"),
  status ("Probation"|"Active"|"OnLeave"|"Resigned"|"Retired"|"Terminated"|"Absconding"),
  joinDate, probationEndDate, exitDate,
  salaryStructureId, bankDetails, documents[],
  portalAccess: { enabled, role, permissions[], mustChangePassword } | null,
  createdAt, updatedAt

Department: _id, ownerScope, name, headEmployeeId, parentDepartmentId
Designation: _id, ownerScope, title, departmentId, level
```

### 8.2 Sub-modules & endpoints (all under `/api/merchant/v1/...`, mirrored per §5.1)

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Employees | CRUD `/employees`; `POST /employees/:id/grant-access`, `/revoke-access`; `POST /employees/:id/offboard` | `employee.view/create/edit/delete/manage_access` |
| Departments | CRUD `/departments` | `department.*` |
| Designations | CRUD `/designations` | `designation.*` |
| Org Chart | `GET /org-chart` (derived, not stored — builds tree from `managerId`) | `employee.view` |
| Attendance | CRUD `/attendance`; `POST /attendance/check-in`, `/check-out`; `GET /attendance/summary` | `attendance.*` |
| Attendance Policies | CRUD `/attendance-policies` | `attendance.manage_policy` |
| Leave Management | CRUD `/leave-requests`; `POST /leave-requests/:id/approve`, `/reject`; CRUD `/leave-types`; `GET /leave-balances` | `leave.apply/approve/manage_types` |
| Shifts | CRUD `/shifts`; `POST /shifts/:id/assign` | `shift.*` |
| Holiday Calendar | CRUD `/holidays` | `holiday.*` |
| Salary | CRUD `/salary-structures` | `salary.*` |
| Payroll Processing | `POST /payroll-batches` (create+run), `GET /payroll-batches/:id`, `POST /payroll-batches/:id/finalize`, `GET /payroll-batches/:id/payslips/:employeeId` | `payroll.run/finalize/view` |
| Provident Fund | CRUD `/provident-fund`; CRUD `/provident-fund/policy` | `pf.*` |
| Special Payments | CRUD `/special-payments`; CRUD `/special-payment-types` | `special_payment.*` |
| Loans | CRUD `/loans`; `POST /loans/:id/approve`, `/record-repayment` | `loan.*` |
| Employee Expenses | CRUD `/employee-expenses`; `POST /employee-expenses/:id/approve` | `employee_expense.*` |
| Requests & Approvals | `GET /requests` (unified inbox across leave/loan/expense/asset), `GET /my-approvals` | `approval.view` |
| Onboarding | CRUD `/onboarding-templates`; CRUD `/onboarding` (per-employee checklist instance) | `onboarding.*` |
| Offboarding | CRUD `/offboarding` — see §8.4 for the asset-reclaim gap fix | `offboarding.*` |
| Recruitment | CRUD `/jobs`; CRUD `/candidates`; `POST /candidates/:id/convert-to-employee` | `recruitment.*` |
| Performance | CRUD `/appraisal-cycles`; CRUD `/appraisals` | `performance.*` |
| Compliance | CRUD `/compliance-records` (certifications, mandatory training, document expiries) | `compliance.*` |
| Announcements | CRUD `/announcements` | `announcement.*` |

### 8.3 Flow: onboarding → active employee

1. Recruitment: candidate marked "Hired" → `POST /candidates/:id/convert-to-employee` creates the Employee record (`status: Probation`) and an Onboarding checklist instance from the selected template.
2. Onboarding tasks (documents, equipment request, account setup) get checked off; equipment request task **must** link to Asset Management (§9.3) rather than being a free-text checklist item — this link does not exist today.
3. On probation end date (or manual action), `status` moves to `Active` — this should be flaggable by the cron in §19 as a reminder, not silently missed.

### 8.4 Flow: offboarding — gap fix (asset reclaim)

**Missing today.** Offboarding an employee must block completion until every Asset currently assigned to them (§9) is either returned (status → available) or explicitly reassigned. `POST /offboarding/:id/complete` checks `GET /assets?assignedTo=:employeeId` server-side and returns `409` with the list of outstanding assets if any remain assigned. The same completion step also finalizes any pending payroll (final settlement) and revokes portal access (§3.4).

### 8.5 Employee as a portal user

An Employee is a plain HR record by default (`portalAccess: null`). Granting access (§3.4) makes them a real login with a role + permission set scoped to their employer's `ownerScope`. This is the mechanism behind `ADMIN_STAFF` and `MERCHANT_STAFF` in §4 — there is no separate "Users" collection to keep in sync.

---

## 9. Module: Asset Management

### 9.1 Data model

```
Asset: _id, ownerScope, assetTag, name, categoryId, status ("Available"|"Assigned"|"UnderMaintenance"|"Retired"|"Disposed"),
  purchaseDate, purchaseCost, vendorId (-> Supplier, §11), warrantyExpiry,
  assignedTo (-> Employee._id, nullable), assignedAt, location, warehouseId (nullable — for bulk/stock-style assets),
  documents[] (invoice, warranty card, photos), createdAt, updatedAt

AssetCategory: _id, ownerScope, name, depreciationMethod, usefulLifeMonths
AssetRequest: _id, ownerScope, requestedBy (-> Employee._id), categoryId, justification, status ("Pending"|"Approved"|"Rejected"|"Fulfilled")
AssetAudit: _id, ownerScope, scheduledDate, scope (category/location filter), findings[] (assetId, expectedStatus, actualStatus, discrepancyNote), status
```

### 9.2 Endpoints

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Assets | CRUD `/assets`; `POST /assets/:id/assign`, `/unassign`, `/transfer`, `/retire`, `/dispose` | `asset.view/create/edit/assign/retire` |
| Categories | CRUD `/asset-categories` | `asset.manage_category` |
| Requests | CRUD `/asset-requests`; `POST /asset-requests/:id/approve`, `/reject`, `/fulfill` | `asset.request/approve_request` |
| Audits | CRUD `/asset-audits`; `POST /asset-audits/:id/record-finding` | `asset.audit` |
| Reports | `GET /asset-reports/utilization`, `/depreciation`, `/warranty-expiring` | `asset.view` |

### 9.3 Cross-links

- `Asset.vendorId` → Supplier (§11) — an asset can be traced back to the Purchase Invoice it was bought on.
- `Asset.assignedTo` → Employee (§8) — surfaced on both the Asset detail (who has it) and Employee detail (what they're holding) pages.
- Asset Requests fulfilled via a purchase → **gap fix**: `AssetRequest.status = "Fulfilled"` should be settable *only* by linking to either an existing free `Asset` record or a new `Purchase Invoice` line (§11), not as an isolated status flip with no paper trail.
- Offboarding block, per §8.4.

---

## 10. Module: Product Management

Products, Variants, Categories, Stock (the stock *ledger view* lives here; physical per-warehouse quantity is owned by Warehouse Management, §12 — the two are already unified in the current frontend via `warehouseFakeData`/`stockFakeData`, and that unification is the model to carry into the backend), Production.

### 10.1 Data model

```
Product: _id, ownerScope, productName, productType ("Physical"|"Service"|"Digital"), sku, categoryId,
  isRawMaterial (bool), baseCostPrice, description, images[], status, createdAt, updatedAt

Variant: _id, ownerScope, productId, variantName, sku, attributes ({Size, Color, Material, ...}),
  costPrice, salePrice, createdAt, updatedAt
  // physical stockQuantity is NOT stored here — see Warehouse §12, StockLevel is the source of truth

Category: _id, ownerScope, name, parentCategoryId

ProductionOrder: _id, ownerScope, outputVariantId, outputQty, inputs: [{ variantId, qty }],
  status ("Draft"|"InProgress"|"Completed"), unitCost (computed), completedAt
```

### 10.2 Endpoints

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Products | CRUD `/products` | `product.*` |
| Variants | CRUD `/variants` | `product.manage_variant` |
| Categories | CRUD `/product-categories` | `product.manage_category` |
| Stock (read view) | `GET /stock` (rows: variant × total qty × per-warehouse breakdown, joins Warehouse §12) | `stock.view` |
| Stock Adjustment | `POST /stock/adjust` (delegates to Warehouse `adjustStock`, §12.3) | `stock.adjust` |
| Production | CRUD `/production-orders`; `POST /production-orders/:id/complete` | `production.*` |

### 10.3 Flow: raw material → finished product (production)

1. `POST /production-orders` with `inputs[]` (raw material variants + qty) and `outputVariantId`/`outputQty`.
2. `POST /production-orders/:id/complete`:
   - Decrements each input variant's warehouse stock (§12.3, type `subtract`).
   - Increments the output variant's warehouse stock (type `add`).
   - Computes `unitCost` from the weighted sum of consumed input costs ÷ output qty, and updates `Variant.costPrice` on the output via a **weighted-average** roll-up against any existing stock of that variant (matches the existing frontend's `updateVariantCostWeightedAverage` logic).
   - All guarded by a single DB transaction — a partial failure must not leave stock decremented on inputs with no corresponding output credit.

### 10.4 Cross-links

- Every Sale Invoice / Quotation / Credit Note line (§11) references `Variant._id`, auto-filling price/unit and, on delivery/return, mutating stock via §12.3.
- Every Purchase Invoice / Purchase Order / Debit Note line (§11) references `Variant._id` the same way, on the receive/return side.

---

## 11. Module: Client & Vendor Management

Customers, Suppliers, Sales, Quotations, Credit Notes, Purchases, Purchase Orders, Debit Notes — the module this session's implementation work lives in, now formalized with `ownerScope` and real endpoints.

### 11.1 Data model

```
Customer: _id, ownerScope, customerCode, name, type, customerType, contact fields,
  openingBalance, creditLimit, creditDays, status, createdAt
  // currentBalance is NOT stored — always derived: openingBalance + Σ(SaleInvoice.total - Σpayments) across their invoices

Supplier: _id, ownerScope, supplierCode, name, supplierType, contact/bank fields, openingBalance, status

SaleInvoice: _id, ownerScope, invoiceNumber, customerId, date, lines: [{ variantId, productName, qty, price, unit, itemDiscount }],
  taxPercent, discount, subtotal, taxAmount, total,
  deliveryStatus ("Pending"|"InTransit"|"Delivered"), stockApplied (bool),
  paymentStatus ("Pending"|"Partial"|"Cleared"), paymentHistory: [{ date, amount, method, reference }]

Quotation: _id, ownerScope, quoteNumber, customerId, lines[], ..., status ("Draft"|"Sent"|"Accepted"|"Rejected"|"Expired"|"Converted"), convertedInvoiceId

CreditNote: _id, ownerScope, cnNumber, customerId, originalInvoiceId, lines[], reason, returnType,
  status ("Draft"|"Approved"|"Applied"|"Voided"), stockApplied (bool)

PurchaseInvoice / PurchaseOrder / DebitNote: mirror the above on the supplier side
  (PurchaseInvoice adds qcStatus "Pending"|"Passed"|"Failed" and status "Draft"|"Received"|"Completed")
```

### 11.2 Endpoints (Sales side — Purchases side mirrors 1:1 with `supplier`/`purchase` naming)

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Customers | CRUD `/customers`; `GET /customers/:id/invoices`, `/payments`, `/balance` | `customer.*` |
| Sales | CRUD `/sales`; `POST /sales/:id/delivery-status` (triggers stock, §12.3, exactly once via `stockApplied`); `POST /sales/:id/payments` | `sale.*`, `sale.record_payment` |
| Quotations | CRUD `/quotations`; `POST /quotations/:id/convert-to-invoice`; `POST /quotations/:id/status` | `quotation.*`, `quotation.convert` |
| Credit Notes | CRUD `/credit-notes`; `POST /credit-notes/:id/status` (Draft→Approved→Applied, Applied triggers restock + invoice credit exactly once) | `credit_note.*`, `credit_note.apply` |
| Suppliers | CRUD `/suppliers`; `GET /suppliers/:id/invoices`, `/payments`, `/balance` | `supplier.*` |
| Purchases | CRUD `/purchases`; `POST /purchases/:id/status` (Received/Completed triggers stock increase exactly once); `POST /purchases/:id/payments` | `purchase.*` |
| Purchase Orders | CRUD `/purchase-orders`; `POST /purchase-orders/:id/convert-to-invoice`; `POST /purchase-orders/:id/status` | `po.*`, `po.convert` |
| Debit Notes | CRUD `/debit-notes`; `POST /debit-notes/:id/status` (Applied triggers stock decrease + invoice credit exactly once) | `debit_note.*`, `debit_note.apply` |

### 11.3 Flows (already validated end-to-end in the current frontend against fake data this session — carry the exact same rules into the backend)

- **Delivery decreases stock exactly once**: guarded server-side by a `stockApplied` boolean on the invoice, flipped inside the same transaction as the stock mutation — never re-derive "was this ever delivered before" from status alone, since status can be edited back and forth.
- **Receiving increases stock exactly once**: same pattern on Purchase Invoices/GRN.
- **Credit Note "Applied"**: restocks each returned line's variant (`add`) and appends a `method: "Credit Note"` entry to the *original* invoice's `paymentHistory` (reduces derived balance) — both effects gated by the same `stockApplied` flag, applied once.
- **Debit Note "Applied"**: mirrors Credit Note on the purchase side — stock `subtract` (goods leaving back to supplier) + a `method: "Debit Note"` credit against the original Purchase Invoice's payable balance.
- **Balance is always derived, never stored** — `openingBalance + Σ(invoice.total) − Σ(payments across those invoices)`, computed at read time. **Gap fix vs. the current frontend fake data**: the pre-existing `Customer.currentBalance`/`Supplier.currentBalance` fields were static random numbers; the backend must never persist a balance field, only compute it, or it will drift from reality the moment any payment/CN/DN posts.

### 11.4 Cross-links into Finance (gap fix — does not exist today)

Every `SaleInvoice` create should post an Accounts Receivable entry (§13) for its `total`; every recorded payment should post a matching AR-clearing entry. Every `PurchaseInvoice` should post an Accounts Payable entry the same way. **This linkage is entirely absent from the current build** (Finance Management is a fully separate flat module today with no connection to Sales/Purchases) — see §13.4 and §14.

---

## 12. Module: Warehouse Management

### 12.1 Data model

```
Warehouse: _id, ownerScope, code, name, location, manager, capacity, status ("Active"|"Inactive")

StockLevel: _id, ownerScope, warehouseId, variantId, qty, minQty
  // the single source of truth for physical stock — Product Management's "Stock" view (§10.2) reads/aggregates this, never stores its own copy

StockTransfer: _id, ownerScope, transferNo, fromWarehouseId, toWarehouseId, date, items: [{variantId, qty}], status ("Pending"|"Completed"|"Cancelled"), approvedBy

GRN (Goods Receipt Note): _id, ownerScope, grnNo, warehouseId, supplierId, poReference, date, status ("Pending"|"Partial"|"Received"), items: [{variantId, orderedQty, receivedQty, unitCost}], stockApplied (bool)

StockIssue: _id, ownerScope, issueNo, warehouseId, issueType, issuedTo, date, items: [{variantId, qty}], reference

StockAdjustment (audit log entry, not a mutable entity): _id, ownerScope, warehouseId, variantId, type ("add"|"subtract"|"set"), qty, reason, adjustedBy, date, balanceBefore, balanceAfter
```

### 12.2 Endpoints

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Warehouses | CRUD `/warehouses`; `DELETE` blocked (`409`) while any `StockLevel.qty > 0` remains for that warehouse | `warehouse.*` |
| Stock Transfers | CRUD `/stock-transfers`; `POST /stock-transfers/:id/approve` (moves stock: subtract source, add destination, in one transaction) | `warehouse.transfer` |
| Goods Receipt | CRUD `/grn`; `POST /grn/:id/mark-received` (applies stock `add` exactly once, guarded by `stockApplied`) | `warehouse.receive` |
| Stock Issues | CRUD `/stock-issues` (create applies stock `subtract` immediately — issues are dispatch-and-done, no separate approval step) | `warehouse.issue` |
| Adjustments | `POST /stock/adjust` (also reachable via Product Management §10.2 — same endpoint); `GET /stock/adjustment-history` | `stock.adjust` |

### 12.3 The `adjustStock` primitive

Every stock-mutating action across every module (Production §10.3, Sales delivery §11.3, Purchase receipt §11.3, Credit/Debit Note reversal §11.3, GRN §12.2, Stock Transfer §12.2, Stock Issue §12.2, manual Adjustment) funnels through **one** backend primitive:

```
adjustStock(ownerScope, variantId, warehouseId, type: "add"|"subtract"|"set", qty, reason, actor) -> newQty
```

This single choke point is what makes "which warehouse holds what" trustworthy — no module should mutate `StockLevel` directly. It also writes one `StockAdjustment` audit row per call, which is what powers §12.2's adjustment history and (via `reason`) traces every quantity change back to the invoice/GRN/transfer that caused it.

### 12.4 Cross-links

Warehouse is the physical execution layer under Product Management (§10) and Client & Vendor Management (§11) — those modules never touch `StockLevel` directly, they call `adjustStock`. This mirrors exactly how the current frontend build already unified Warehouse and Inventory Stock (`stockFakeData.js` delegates to `warehouseFakeData.js`'s `adjustWarehouseStock`) — the backend should preserve that single-source-of-truth shape rather than re-fragmenting it.

---

## 13. Module: Finance Management

Each tenant's own bookkeeping — separate from Platform Billing (§7), which is the *platform* charging *tenants*, not a tenant's internal accounting.

### 13.1 Data model

```
Account (Chart of Accounts): _id, ownerScope, code, name, type ("Asset"|"Liability"|"Equity"|"Income"|"Expense"), parentAccountId

JournalEntry: _id, ownerScope, date, reference, memo, lines: [{ accountId, debit, credit }], postedBy, sourceModule, sourceId
  // sourceModule/sourceId trace every auto-posted entry back to what caused it (a SaleInvoice, a PayrollBatch, ...) — see §13.4

LedgerEntry: derived view over JournalEntry lines, per account, running balance — not separately stored.

ARRecord / APRecord: _id, ownerScope, partyType ("Customer"|"Supplier"), partyId, sourceInvoiceId, amount, amountPaid, dueDate, status
Expense / Income: _id, ownerScope, category, accountId, amount, date, description, attachments[]
BankAccount: _id, ownerScope, name, bankName, accountNumber, currency, openingBalance
BankTransaction: _id, ownerScope, bankAccountId, date, type ("Deposit"|"Withdrawal"), amount, reference, reconciled (bool)
VatRecord: _id, ownerScope, period, taxableAmount, vatAmount, filedStatus
```

### 13.2 Endpoints

| Sub-module | Key endpoints | Permission keys |
|---|---|---|
| Chart of Accounts | CRUD `/finance/accounts` | `finance.manage_coa` |
| Ledger | `GET /finance/ledger?accountId=` | `finance.view_ledger` |
| Journal Entries | CRUD `/finance/journal-entries`; manual entries only — auto-posted ones (§13.4) are read-only via this endpoint | `finance.post_journal` |
| Accounts Receivable | `GET /finance/ar`; `POST /finance/ar/:id/record-payment` | `finance.view_ar/record_ar_payment` |
| Accounts Payable | `GET /finance/ap`; `POST /finance/ap/:id/record-payment` | `finance.view_ap/record_ap_payment` |
| Expenses | CRUD `/finance/expenses` | `finance.manage_expense` |
| Income | CRUD `/finance/income` | `finance.manage_income` |
| Invoices (finance-level, distinct from Sales invoices) | CRUD `/finance/invoices` | `finance.manage_invoice` |
| Payments | CRUD `/finance/payments` | `finance.manage_payment` |
| Bank & Cash | CRUD `/finance/bank-accounts`; CRUD `/finance/bank-accounts/:id/transactions` | `finance.manage_bank` |
| Bank Reconciliation | `POST /finance/bank-reconciliation/run`; `POST /finance/bank-reconciliation/:txnId/match` | `finance.reconcile` |
| VAT / Tax | CRUD `/finance/vat`; `POST /finance/vat/:id/file` | `finance.manage_tax` |
| Financial Reports | `GET /finance/reports/pnl`, `/balance-sheet`, `/cash-flow`, `/trial-balance` | `finance.view_reports` |

### 13.3 Flow: double-entry posting rule

Every `JournalEntry` must balance (`Σdebit === Σcredit`) — enforced at the write layer, not just UI validation, since this is the one module where a silent imbalance corrupts every downstream report.

### 13.4 Gap fix — auto-posting from operational modules

**This does not exist today; Finance Management is currently a fully isolated flat module.** The backend must post `JournalEntry` rows automatically (with `sourceModule`/`sourceId` set) from:

| Trigger | Posts |
|---|---|
| Sale Invoice created | Debit AR, Credit Sales Income |
| Sale payment recorded | Debit Bank/Cash, Credit AR |
| Purchase Invoice received | Debit Inventory (or Expense, if non-stock), Credit AP |
| Purchase payment recorded | Debit AP, Credit Bank/Cash |
| Credit Note applied | Debit Sales Income (reversal), Credit AR |
| Debit Note applied | Debit AP, Credit Inventory (reversal) |
| Payroll batch finalized (§8.2) | Debit Salary Expense, Credit Bank/Cash (or Payable, if unpaid) |
| Asset purchased (§9) | Debit Fixed Assets, Credit AP/Bank |
| Employee Expense approved (§8.2) | Debit relevant Expense account, Credit Payable/Bank |

Without this, Finance's AR/AP/Reports are permanently out of sync with the actual sales/purchase/payroll activity happening in the rest of the platform — this is the single highest-value backend integration in the whole spec.

---

## 14. Cross-module integration map

```
Recruitment ──convert──> Employee ──onboard──> Active
                              │                    │
                              ├─assign Asset────────┤
                              │                    │
                              ├─payroll run────────>Finance (Journal: Salary Expense)
                              │
                              └─offboard (blocked until assets returned, §8.4)

Product/Variant <──line item── Quotation ──convert──> Sale Invoice ──delivered──> Warehouse.adjustStock(subtract)
                                                              │                          │
                                                              ├─payment recorded          │
                                                              │       │                   │
                                                              │       v                   v
                                                              │   Finance (AR clear)  Product Stock view (derived)
                                                              │
                                                              └─return──> Credit Note ──applied──> Warehouse.adjustStock(add) + Finance (AR reversal)

Product/Variant <──line item── Purchase Order ──convert──> Purchase Invoice ──received──> Warehouse.adjustStock(add) ──> Finance (AP)
                                                                    │
                                                                    └─return──> Debit Note ──applied──> Warehouse.adjustStock(subtract) + Finance (AP reversal)

Asset ──purchased via── Purchase Invoice (vendor = Supplier)
Asset ──assigned to── Employee
Asset Request ──fulfilled via── Purchase Invoice line OR existing Asset

Admin/Merchant Management ──drives ownerScope on── every record above
Platform Billing ──gates access to── every module above (§7.3)
```

Every arrow above that is **not** already implemented in the current frontend fake-data build is called out explicitly with "gap fix" in its module section — most notably §13.4 (Finance auto-posting) and §8.4 (offboarding asset block), which are the two integration points most likely to be silently skipped if the backend is built module-by-module without this map.

---

## 15. Dashboard & reports

| Portal | Dashboard shows |
|---|---|
| Super Admin | Platform-wide KPIs: total admins/merchants, MRR (from Platform Billing), overdue subscriptions, platform-wide module usage, system health/audit alerts. |
| Admin | Their own operational snapshot + a rollup across their merchants (revenue, headcount, stock value, overdue receivables) — never raw merged transaction lists, only aggregates, per §2.1's "siblings, not merged" rule. |
| Merchant | Standard ERP dashboard: sales/purchases this period, stock alerts, cash position, pending approvals, upcoming payroll. |

**Endpoints**: `GET /api/{portal}/v1/dashboard` (role-aware, single call, backend composes from the modules above rather than the frontend firing a dozen requests) and `GET /api/{portal}/v1/reports/{report-type}` for the deeper Reports Hub (per-module report exports already exist as sidebar items today — e.g. Asset Reports §9.2 — the top-level Reports Hub is the cross-module rollup on top of them).

---

## 16. Notifications & announcements

```
Notification: _id, recipientType ("ADMIN"|"MERCHANT"|"EMPLOYEE"), recipientId, type, title, body, link, read (bool), createdAt
Announcement: _id, ownerScope, title, body, audience ("All"|departmentId list), publishedAt, expiresAt
```

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/{portal}/v1/notifications` | List, unread-count included in `meta` |
| `POST` | `/api/{portal}/v1/notifications/:id/read` | Mark read |
| `POST` | `/api/{portal}/v1/notifications/push` | System/admin-triggered push (existing `push_notifications` permission) |
| CRUD | `/api/{admin\|merchant}/v1/announcements` | Org-wide announcements (existing HR sidebar item) |

Notification triggers are listed inline throughout this document wherever a flow says "notification to..." (§6.4 re-parenting, §7.4 billing suspension, §8.4 offboarding, §12 low-stock, §19 cron jobs) rather than duplicated here.

---

## 17. Settings & feature flags

Per-tenant settings (`ownerScope`-scoped): org profile, currency/locale/timezone defaults, numbering-format for invoices/POs/etc. (`SINV-{year}{seq}` style, already the convention throughout §11), and the **read-only** view of `Subscription.plan.moduleAccess`/`limits` (editable only via Platform Billing, §7 — settings shows it, never lets a tenant grant themselves a module their plan doesn't include).

```
GET/PATCH /api/{admin|merchant}/v1/settings
```

---

## 18. Audit log

**Gap fix — does not exist anywhere in the current build**, and is non-negotiable for a system where a Super Admin can act on any Admin's or Merchant's data, and an Admin can act on any of their Merchants' data.

```
AuditLogEntry: _id, actorType, actorId, actorTier ("SUPER_ADMIN"|"ADMIN"|"ADMIN_STAFF"|"MERCHANT_OWNER"|"MERCHANT_STAFF"),
  action ("create"|"update"|"delete"|"status_change"|"login"|"impersonate_access"|...),
  targetOwnerScope, module, entityId, before, after, ipAddress, timestamp
```

Every write endpoint in this document logs one entry. Drill-down/impersonation access (§5.2) additionally logs a `login`-style entry the moment an Admin/Super Admin opens a merchant's data, even without writing anything — a Merchant should be able to see, on request, exactly which Admin staff looked at their books and when.

```
GET /api/{portal}/v1/audit-log   (Super Admin: platform-wide; Admin/Merchant: their own ownerScope only)
```

---

## 19. Cron / scheduled jobs

| Job | Frequency | What it does |
|---|---|---|
| Billing cycle generator | Daily | For every `Subscription` with `nextBillingDate <= today`, create the next `BillingInvoice`, advance `nextBillingDate` |
| Overdue billing → suspend | Daily | Flip `Overdue` invoices past grace period, cascade to §3.6/§7.4 suspension, notify (§16) |
| Low stock alert | Daily (or on every `adjustStock` call, whichever is cheaper) | `StockLevel.qty <= minQty` → notification to Merchant + rollup to Admin |
| Asset warranty/lease expiry reminder | Daily | `Asset.warrantyExpiry` within N days → notification |
| Employee document/compliance expiry reminder | Daily | Certifications, visas, contracts nearing `expiresAt` |
| Leave balance accrual | Monthly / configurable | Credits leave balances per policy |
| Probation end reminder | Daily | Flags employees whose `probationEndDate` has passed with no status change (§8.3) |
| Payroll run reminder | Monthly, N days before pay date | Notifies whoever holds `payroll.run` that a batch needs creating |
| Invoice/PO overdue reminder | Daily | Sale/Purchase invoices past due date, unpaid — notification + surfaces on dashboard (§15) |
| Audit-log retention/archival | Weekly | Cold-archives entries past retention window (compliance, not deletion) |
| Session/refresh-token cleanup | Hourly | Expired tokens purged |
| Report cache warm-up | Nightly | Pre-computes heavy dashboard aggregates (§15) so portal load stays fast |

---

## 20. Missing-flow fixes — explicit gap log

A consolidated list of every gap called out inline above, for a reviewer who wants the "what did you add that wasn't asked for" list in one place:

1. **Forgot-password flow** (§3.5) — mandatory given zero self-signup; entirely absent today.
2. **Temp password should be system-generated and emailed, not typed by the creator** (§6.3) — current fake-data `AddAdmin`/`AddMerchant` forms have a manual password field.
3. **Suspending an Admin must not silently break their Merchants' day-to-day operation** (§3.6) — explicit cascade rule needed, not left implicit.
4. **Re-parenting a merchant** (§6.4) — no such flow exists; Super Admin needs it (admins churn, get demoted, merge territories).
5. **Plan/feature-flag enforcement, both frontend nav-hiding and backend hard-block** (§7.3) — currently nothing gates module access by subscription tier at all.
6. **Onboarding equipment-request task must link to a real Asset**, not a free-text checklist line (§8.3).
7. **Offboarding blocked until all assigned Assets are returned** (§8.4) — no such guard exists; today an employee could be deleted while still "holding" company equipment on paper.
8. **Asset Requests need a real fulfillment trail** (linked Purchase Invoice or existing Asset), not an isolated status flip (§9.3).
9. **Customer/Supplier balance must always be derived, never stored** (§11.3) — the current frontend fake data used a static random `currentBalance` field; this was already fixed in this session's frontend work and must carry through to the backend schema (no `currentBalance` column at all).
10. **`stockApplied`-style idempotency guards on every stock-mutating status transition** (§11.3, §12.3) — delivery, receipt, GRN, Credit/Debit Note — each must apply its stock effect exactly once even if the status is edited back and forth; this was hard-learned in this session's frontend build and needs the same discipline server-side.
11. **Finance Management auto-posting from Sales/Purchases/Payroll/Assets/Expenses** (§13.4) — the single biggest structural gap found; today Finance is a fully isolated module.
12. **Audit log** (§18) — does not exist anywhere; required the moment cross-tenant drill-down access exists.
13. **Granular per-module RBAC permission keys** (§4.2) — the current build gates most modules (Assets, Products, Finance, Clients & Vendors) on the Customer module's permission ids as a placeholder; every module needs its own real keys.
14. **Route/permission cleanup**: a duplicate `/customers` route registration (legacy travel-agency Customer page vs. new Clients & Vendors Customer page) exists in the current frontend router — dead code to remove when this new architecture is implemented, not something to design around.
15. **Single unified numbering convention** for all document series (`SINV-`, `PINV-`, `PO-`, `CN-`, `DN-`, `QT-`, `GRN-`) should be a per-tenant configurable setting (§17), not hardcoded per module — a merchant should be able to set their own invoice prefix.

---

## 21. Out of scope

The following exist in the current codebase's routes and role list but are **not** part of this architecture, per the confirmed decision in §0: Agency, Driver, Vehicle (+ Type/Make/Model/Variant), Booking, Booking Calendar, Package, Pricing, Kashaf, Inquiry, Lead, Opportunity, FAQ, Communication, and the legacy flat `User`/`Role` module (superseded by §4's RBAC model). These should be treated as a separate legacy product surface, either deprecated outright or migrated independently — building the new multi-tenant system should not attempt to retrofit tenancy onto them.

---

## 22. Appendix: entity relationship summary

```
Admin (1) ──creates──> (0..N) Merchant
Admin (1) ──owns (ownerType=ADMIN)──> Employee, Asset, Product, Customer, Supplier, Warehouse, Finance.* [their own]
Merchant (1) ──owns (ownerType=MERCHANT)──> Employee, Asset, Product, Customer, Supplier, Warehouse, Finance.* [their own]

Employee (1) ──0..1──> portalAccess (makes them ADMIN_STAFF or MERCHANT_STAFF)
Employee (0..N) ──assigned──> Asset
Employee (0..1) ──manager──> Employee (self-referential, org chart)

Product (1) ──1..N──> Variant
Variant (1) ──N──> StockLevel (per warehouse)
Warehouse (1) ──N──> StockLevel

Customer (1) ──N──> SaleInvoice, Quotation, CreditNote
Supplier (1) ──N──> PurchaseInvoice, PurchaseOrder, DebitNote
SaleInvoice/PurchaseInvoice (1) ──N──> line items ──> Variant

Subscription (1) ──1──> SubscriptionPlan
Subscription (1) ──N──> BillingInvoice
Admin | Merchant (1) ──1 active──> Subscription

JournalEntry ──sourceModule/sourceId──> any of the above (traceability, §13.4)
AuditLogEntry ──targets──> any of the above (traceability, §18)
```
