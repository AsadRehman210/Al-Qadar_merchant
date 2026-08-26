/** Purchase invoice's product type: raw material (production input) vs
 *  finished goods — a single invoice-level field, not per-line. */
export const PURCHASE_LINE_TYPES = {
  raw_material: "raw_material",
  final_product: "final_product",
};

export const defaultPurchaseLine = () => ({
  variantId: "", productName: "", qty: 1, price: 0, unit: "pcs", expiryDate: "", taxPercent: null,
});

/** Pure line-math helper (pre-tax subtotal) — used client-side for display
 *  only; the backend computes and persists subtotal/taxAmount/total/
 *  balanceDue itself. A line's own `taxPercent` (if set) overrides the
 *  invoice-level rate for that one line — see PurchaseInvoiceForm's
 *  `effectiveLineTaxPercent`, which mirrors the backend's own fallback rule
 *  exactly. */
export const lineTotal = (l) => (Number(l?.qty) || 0) * (Number(l?.price) || 0);
