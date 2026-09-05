// Pure helpers over the real Stock endpoint's rows — split out of the old
// stockFakeData.js so it can be deleted once nothing depends on its
// in-memory data. Rows here are the backend's StockRow DTO:
// { variantId, variantName, sku, productId, productName, totalQty, minQty, byWarehouse }

export const computeStatus = (quantity, minStock) => {
  if (quantity <= 0) return "out_of_stock";
  if (minStock > 0 && quantity < minStock) return "low_stock";
  return "in_stock";
};

export const stockLocation = (row) =>
  (row.byWarehouse || []).filter((w) => w.qty > 0).length
    ? row.byWarehouse.filter((w) => w.qty > 0).map((w) => `${w.warehouseName} (${w.qty})`).join(", ")
    : "—";

export const computeStockSummary = (rows) => {
  const list = rows || [];
  const withStatus = list.map((r) => computeStatus(Number(r.totalQty) || 0, r.minQty || 0));
  return {
    totalSkus: list.length,
    totalUnits: list.reduce((s, r) => s + (Number(r.totalQty) || 0), 0),
    lowStockCount: withStatus.filter((s) => s === "low_stock").length,
    outOfStockCount: withStatus.filter((s) => s === "out_of_stock").length,
  };
};
