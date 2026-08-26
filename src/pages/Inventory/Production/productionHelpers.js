// Pure form-default/utility helpers for Production — split out of the old
// productionFakeData.js so it can be deleted once nothing depends on its
// in-memory _orders array. No fake data, no side effects.

export const defaultRawLine = () => ({
  variantId: "",
  quantity: "",
  actualQuantity: "",
});

/** A free-form cost that isn't raw material — labor, electricity, packaging,
 *  etc. — added on top of raw material cost to get the batch's true total cost. */
export const defaultOtherCostLine = () => ({
  label: "",
  amount: "",
});

export const DEFAULT_PRODUCTION_ORDER = {
  scheduledDate: "",
  outputVariantId: "",
  outputQuantity: "",
  warehouseId: "",
  notes: "",
  rawLines: [defaultRawLine()],
  otherCostLines: [defaultOtherCostLine()],
};

/** Live cost preview while an order is still being drafted — the same
 *  qty×cost + overhead formula the backend's /complete endpoint uses, but
 *  pure (no side effects) and based on planned `quantity`/`outputQuantity`
 *  rather than actuals, so it can be recomputed on every keystroke.
 *  `variantCostById` is a Map<variantId, costPrice> built from the loaded
 *  variant list. */
export const computeProductionCost = (rawLines, otherCostLines, outputQuantity, variantCostById = new Map()) => {
  let totalRawCost = 0;
  (rawLines || []).forEach((line) => {
    if (!line.variantId) return;
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) return;
    totalRawCost += qty * (Number(variantCostById.get(line.variantId)) || 0);
  });
  const totalOtherCost = (otherCostLines || []).reduce(
    (sum, line) => sum + (Number(line.amount) || 0),
    0,
  );
  const totalCost = totalRawCost + totalOtherCost;
  const outputQty = Number(outputQuantity) || 0;
  return {
    totalRawCost: Math.round(totalRawCost * 100) / 100,
    totalOtherCost: Math.round(totalOtherCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    unitCost: outputQty > 0 ? Math.round((totalCost / outputQty) * 100) / 100 : 0,
  };
};
