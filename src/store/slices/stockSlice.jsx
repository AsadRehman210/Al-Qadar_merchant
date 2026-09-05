import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,

  history: [],
  historyTotalRecords: 0,
  historyLoading: false,

  summary: { totalSkus: 0, totalUnits: 0, lowStockCount: 0, outOfStockCount: 0 },
  summaryLoading: false,

  openingImported: false,
  openingImportedAt: null,
  openingStatusLoading: false,
};

// Rows: { variantId, variantName, sku, productId, productName, totalQty,
// minQty, byWarehouse: [{warehouseId, warehouseName, qty, minQty}] }
export const fetchStock = createAsyncThunk(
  "stock/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stock}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// { totalSkus, totalUnits, lowStockCount, outOfStockCount } — computed
// server-side so the stat cards never need a full bulk fetch of every row.
export const fetchStockSummary = createAsyncThunk(
  "stock/fetchSummary",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.stock}/summary?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
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
    if (!response?.success) return rejectWithValue(response?.message || response?.error_message);
    return response.result;
  },
);

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {},
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
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchStockSummary.pending, (state) => {
        state.summaryLoading = true;
      })
      .addCase(fetchStockSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload || state.summary;
      })
      .addCase(fetchStockSummary.rejected, (state) => {
        state.summaryLoading = false;
      })
      .addCase(fetchAdjustmentHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAdjustmentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.result || [];
        state.historyTotalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAdjustmentHistory.rejected, (state) => {
        state.historyLoading = false;
        state.history = [];
      })
      .addCase(fetchOpeningStockStatus.pending, (state) => {
        state.openingStatusLoading = true;
      })
      .addCase(fetchOpeningStockStatus.fulfilled, (state, action) => {
        state.openingStatusLoading = false;
        state.openingImported = Boolean(action.payload?.imported);
        state.openingImportedAt = action.payload?.importedAt || null;
      })
      .addCase(fetchOpeningStockStatus.rejected, (state) => {
        state.openingStatusLoading = false;
      })
      .addCase(importOpeningStock.fulfilled, (state, action) => {
        state.openingImported = Boolean(action.payload?.imported);
        state.openingImportedAt = action.payload?.importedAt || null;
      });
  },
});

export const showStock = (state) => state.stock.list;
export const showStockTotal = (state) => state.stock.totalRecords;
export const showStockLoading = (state) => state.stock.loading;
export const showStockSummary = (state) => state.stock.summary;
export const showStockSummaryLoading = (state) => state.stock.summaryLoading;
export const showAdjustmentHistory = (state) => state.stock.history;
export const showAdjustmentHistoryTotal = (state) => state.stock.historyTotalRecords;
export const showAdjustmentHistoryLoading = (state) => state.stock.historyLoading;
export const showOpeningStockImported = (state) => state.stock.openingImported;
export const showOpeningStockImportedAt = (state) => state.stock.openingImportedAt;
export const showOpeningStockStatusLoading = (state) => state.stock.openingStatusLoading;
export default stockSlice.reducer;
