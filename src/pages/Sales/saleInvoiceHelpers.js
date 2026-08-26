/** Pure line-math helpers — used client-side for display only; the backend
 *  computes and persists subtotal/taxAmount/total/balanceDue itself. */
export const defaultLine = () => ({ variantId: "", productName: "", qty: 1, price: 0, costPrice: 0, unit: "pcs" });

export const lineTotal = (l) =>
  (Number(l?.qty) || 0) * (Number(l?.price) || 0);

export const lineProfit = (l) =>
  lineTotal(l) - (Number(l?.qty) || 0) * (Number(l?.costPrice) || 0);

export const computeInvoiceProfit = (lines) =>
  (lines || []).reduce((s, l) => s + lineProfit(l), 0);
