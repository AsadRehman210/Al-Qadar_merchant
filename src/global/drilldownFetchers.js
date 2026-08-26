import { erpGet, buildQuery, isEmptyListResponse } from "api/erpClient";
import { erpUrls } from "global/config";

// Shared by every AnalyticsDrilldownModal `fetcher` — normalizes this app's
// pagination() envelope (and its "empty list = success:false,404" quirk,
// see erpClient.js) into the flat { result, total_records } shape the modal
// expects, so each individual fetcher below only has to name its endpoint.
const fetchPaginated = async (url, params) => {
  const query = buildQuery(params);
  const response = await erpGet(`${url}?${query}`);
  if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
  if (!response?.success) throw new Error(response?.message || "Request failed");
  return { result: response.result || [], total_records: response.total_records || 0 };
};

const fmtDate = (v) => (v ? String(v).slice(0, 10) : "—");
const fmtMoney = (n) => `${(parseFloat(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR`;

// ─── Employees ──────────────────────────────────────────────────────────
export const employeeColumns = [
  { label: "Employee", render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
  { label: "Code", render: (r) => r.employeeCode || "—" },
  { label: "Department", render: (r) => r.departmentName || "—" },
  { label: "Status", render: (r) => r.status || "—" },
];
export const fetchEmployeesByDepartment = (departmentId) => ({ page, limit }) =>
  fetchPaginated(erpUrls.employees, { page, limit, departmentId });
export const fetchAllEmployees = () => ({ page, limit }) =>
  fetchPaginated(erpUrls.employees, { page, limit });
export const employeeRowLink = (row, navigate) => navigate(`/employees/details/${row.id}`);

// ─── Attendance (present / absent / on leave / half-day, today) ───────────
export const attendanceColumns = [
  { label: "Employee", render: (r) => r.employeeName || "—" },
  { label: "Status", render: (r) => r.status || "—" },
  { label: "Check In", render: (r) => r.checkIn || "—" },
  { label: "Check Out", render: (r) => r.checkOut || "—" },
];
export const fetchAttendanceByStatus = (status, date) => ({ page, limit }) =>
  fetchPaginated(erpUrls.attendance, { page, limit, status, startDate: date, endDate: date });
export const fetchUnmarkedToday = (date) => ({ page, limit }) =>
  fetchPaginated(`${erpUrls.hrAnalytics}/unmarked-today`, { page, limit, date });
export const unmarkedColumns = employeeColumns;
export const attendanceRowLink = (row, navigate) => navigate(`/employees/details/${row.employeeId}`);

// ─── Inventory ──────────────────────────────────────────────────────────
export const productColumns = [
  { label: "Product", render: (r) => r.productName || "—" },
  { label: "Category", render: (r) => r.categoryName || "—" },
  { label: "Type", render: (r) => r.productType || "—" },
  { label: "Status", render: (r) => r.status || "—" },
];
export const fetchAllProducts = () => ({ page, limit }) =>
  fetchPaginated(erpUrls.products, { page, limit });
export const fetchProductsByCategory = (categoryId) => ({ page, limit }) =>
  fetchPaginated(erpUrls.products, { page, limit, categoryId });
export const productRowLink = (row, navigate) => navigate(`/inventory/products/detail/${row.id}`);

export const variantColumns = [
  { label: "SKU", render: (r) => r.sku || "—" },
  { label: "Variant", render: (r) => r.variantName || "—" },
  { label: "Cost Price", render: (r) => fmtMoney(r.costPrice) },
  { label: "Sale Price", render: (r) => fmtMoney(r.salePrice) },
];
export const fetchAllVariants = () => ({ page, limit }) =>
  fetchPaginated(erpUrls.variants, { page, limit });
export const variantRowLink = (row, navigate) => navigate(`/inventory/stock/detail/${row.id}`);

export const stockColumns = [
  { label: "SKU", render: (r) => r.sku || "—" },
  { label: "Product", render: (r) => r.productName || "—" },
  { label: "Qty", render: (r) => r.totalQty ?? 0 },
  { label: "Status", render: (r) => (r.status === "out_of_stock" ? "Out" : r.status === "low_stock" ? "Low" : "OK") },
];
export const fetchStockByStatus = (status) => ({ page, limit }) =>
  fetchPaginated(erpUrls.stock, { page, limit, status });
export const stockRowLink = (row, navigate) => navigate(`/inventory/stock/detail/${row.variantId}`);

export const expiryColumns = [
  { label: "SKU", render: (r) => r.sku || "—" },
  { label: "Product", render: (r) => r.productName || "—" },
  { label: "Warehouse", render: (r) => r.warehouseName || "—" },
  { label: "Expiry", render: (r) => r.expiryDate || "—" },
  { label: "Qty", render: (r) => r.remainingQty ?? 0 },
];
export const fetchExpiryBucketDetail = (bucketKey) => ({ page, limit }) =>
  fetchPaginated(`${erpUrls.inventoryAnalytics}/expiry/${bucketKey}`, { page, limit });
export const expiryRowLink = (row, navigate) => navigate(`/inventory/stock/detail/${row.variantId}`);

// ─── Sales ──────────────────────────────────────────────────────────────
export const topProductColumns = [
  { label: "Product", render: (r) => r.productName || "—" },
  { label: "Qty Sold", render: (r) => r.qtySold ?? 0 },
  { label: "Revenue", render: (r) => fmtMoney(r.revenue) },
  { label: "Profit", render: (r) => fmtMoney(r.profit) },
];
export const fetchTopProductsPaginated = () => ({ page, limit }) =>
  fetchPaginated(`${erpUrls.salesAnalytics}/top-products-paginated`, { page, limit });

export const saleInvoiceColumns = [
  { label: "Invoice #", render: (r) => r.invoiceNumber || "—" },
  { label: "Customer", render: (r) => r.customerName || "—" },
  { label: "Date", render: (r) => fmtDate(r.date) },
  { label: "Total", render: (r) => fmtMoney(r.total) },
  { label: "Status", render: (r) => r.paymentStatus || "—" },
];
export const fetchAllSaleInvoices = () => ({ page, limit }) =>
  fetchPaginated(erpUrls.saleInvoices, { page, limit });
export const saleInvoiceRowLink = (row, navigate) => navigate(`/sales/detail/${row.id}`);
