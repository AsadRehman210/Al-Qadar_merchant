// Pure form-default/utility helpers for Production — split out of the old
// productionFakeData.js so it can be deleted once nothing depends on its
// in-memory _orders array. No fake data, no side effects.

export const defaultRawLine = () => ({
  warehouseId: "",
  variantId: "",
  quantity: "",
  costPrice: "",
});

export const defaultOutputLine = () => ({
  warehouseId: "",
  quantity: "",
  expiryDate: "",
});

/** A free-form cost that isn't raw material — labor, electricity, packaging,
 *  etc. — added on top of raw material cost to get the batch's true total cost. */
export const defaultOtherCostLine = () => ({
  label: "",
  amount: "",
});

export const DEFAULT_PRODUCTION_ORDER = {
  completedDate: "",
  outputVariantId: "",
  outputVariantName: "",
  outputQuantity: "",
  actualOutputQuantity: "",
  warehouseId: "",
  warehouseName: "",
  outputWarehouseId: "",
  outputWarehouseName: "",
  outputExpiryDate: "",
  notes: "",
  rawLines: [defaultRawLine()],
  outputLines: [defaultOutputLine()],
  otherCostLines: [defaultOtherCostLine()],
  quarantineLotId: "",
  quarantineLotNumber: "",
  quarantineQty: "",
  quarantineCostPrice: "",
};

/** Live cost preview while an order is still being drafted — matches backend
 *  create/complete costing. Quarantine renew cost (qty×lot unit cost) folds
 *  into totalRawCost alongside catalog raw materials. */
export const computeProductionCost = (
  rawLines,
  otherCostLines,
  outputQuantityOrLines,
  variantCostById = new Map(),
  quarantineCost = 0,
) => {
  let materialsCost = 0;
  (rawLines || []).forEach((line) => {
    if (!line.variantId) return;
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) return;
    const unit = Number(line.costPrice ?? variantCostById.get(line.variantId)) || 0;
    materialsCost += qty * unit;
  });
  const totalRawCost = materialsCost + (Number(quarantineCost) || 0);
  const totalOtherCost = (otherCostLines || []).reduce(
    (sum, line) => sum + (Number(line.amount) || 0),
    0,
  );
  const totalCost = totalRawCost + totalOtherCost;
  let outputQty = 0;
  if (Array.isArray(outputQuantityOrLines)) {
    outputQty = outputQuantityOrLines.reduce((s, l) => s + (Number(l?.quantity) || 0), 0);
  } else {
    outputQty = Number(outputQuantityOrLines) || 0;
  }
  return {
    materialsCost,
    quarantineCost: Number(quarantineCost) || 0,
    totalRawCost,
    totalOtherCost,
    totalCost,
    unitCost: outputQty > 0 ? totalCost / outputQty : 0,
  };
};
