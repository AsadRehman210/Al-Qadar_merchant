import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, isEmptyListResponse, buildQuery } from "api/erpClient";

const EMPTY_SUMMARY = { totalSkus: 0, totalUnits: 0, lowStockCount: 0, outOfStockCount: 0 };

const initialState = {
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,

  history: [],
  historyTotalRecords: 0,
  // Filter-aware KPI cards — comes back as `misc_data` on the same list
  // response (search / warehouse / status), not a separate /summary call.
  summary: EMPTY_SUMMARY,

  openingImported: false,
  openingImportedAt: null,
};

// Rows: { variantId, variantName, sku, productId, productName, totalQty,
// minQty, byWarehouse: [{warehouseId, warehouseName, qty, minQty}] }
export const fetchStock = createAsyncThunk(
  "stock/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stock}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0, misc_data: EMPTY_SUMMARY };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchAdjustmentHistory = createAsyncThunk(
  "stock/fetchAdjustmentHistory",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stock}/adjustment-history?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchOpeningStockStatus = createAsyncThunk(
  "stock/fetchOpeningStatus",
  async (params = {}, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const suffix = query ? `?${query}` : "";
    const response = await erpGet(`${erpUrls.openingStockImport}/status${suffix}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const importOpeningStock = createAsyncThunk(
  "stock/importOpeningStock",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.openingStockImport, data);
    if (!response?.success) {
      const rowErrors = Array.isArray(response?.error_message) ? response.error_message : [];
      const detail = rowErrors
        .slice(0, 3)
        .map((e) => (e?.row ? `Row ${e.row}: ${e.message}` : e?.message))
        .filter(Boolean)
        .join(" | ");
      return rejectWithValue(detail || response?.message || response?.error_message);
    }
    return response.result;
  },
);

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    clearStockList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
      state.summary = EMPTY_SUMMARY;
    },
    clearStockHistory: (state) => {
      state.history = [];
      state.historyTotalRecords = 0;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
        state.summary = action.payload.misc_data || EMPTY_SUMMARY;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.summary = EMPTY_SUMMARY;
        state.error = action.payload;
      })
      .addCase(fetchAdjustmentHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdjustmentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.result || [];
        state.historyTotalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAdjustmentHistory.rejected, (state) => {
        state.loading = false;
        state.history = [];
      })
      .addCase(fetchOpeningStockStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOpeningStockStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.openingImported = Boolean(action.payload?.imported);
        state.openingImportedAt = action.payload?.importedAt || null;
      })
      .addCase(fetchOpeningStockStatus.rejected, (state) => {
        state.loading = false;
      })
      .addCase(importOpeningStock.fulfilled, (state, action) => {
        state.openingImported = Boolean(action.payload?.imported);
        state.openingImportedAt = action.payload?.importedAt || null;
      });
  },
});

export const { clearStockList, clearStockHistory } = stockSlice.actions;
export const showStock = (state) => state.stock.list;
export const showStockTotal = (state) => state.stock.totalRecords;
export const showStockLoading = (state) => state.stock.loading;
export const showStockSummary = (state) => state.stock.summary;
export const showAdjustmentHistory = (state) => state.stock.history;
export const showAdjustmentHistoryTotal = (state) => state.stock.historyTotalRecords;
export const showAdjustmentHistoryLoading = (state) => state.stock.loading;
export const showOpeningStockImported = (state) => state.stock.openingImported;
export const showOpeningStockImportedAt = (state) => state.stock.openingImportedAt;
export const showOpeningStockStatusLoading = (state) => state.stock.loading;
export default stockSlice.reducer;
