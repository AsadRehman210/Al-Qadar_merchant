/** Batch history's warehouse/sort filters — sent as query params to the
 *  batches API (stock-batch-service.getAll), not applied client-side. */
export const DEFAULT_BATCH_TABLE_FILTERS = {
  warehouseId: "all",
  sortId: "",
};
