import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,
};

// Read-only — batches are written server-side as a side effect of Purchase
// receiving (and Production complete), never created directly from the UI.
export const fetchStockBatches = createAsyncThunk(
  "stockBatch/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stockBatches}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

const stockBatchSlice = createSlice({
  name: "stockBatch",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchStockBatches.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      });
  },
});

export const showStockBatches = (state) => state.stockBatch.list;
export const showStockBatchesTotal = (state) => state.stockBatch.totalRecords;
export const showStockBatchesLoading = (state) => state.stockBatch.loading;
export default stockBatchSlice.reducer;
