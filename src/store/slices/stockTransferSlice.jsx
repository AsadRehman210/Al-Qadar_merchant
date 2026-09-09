import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,
};

export const fetchStockTransfers = createAsyncThunk(
  "stockTransfer/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stockTransfers}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchStockTransferById = createAsyncThunk(
  "stockTransfer/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.stockTransfers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createStockTransfer = createAsyncThunk(
  "stockTransfer/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.stockTransfers, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateStockTransfer = createAsyncThunk(
  "stockTransfer/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.stockTransfers}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteStockTransfer = createAsyncThunk(
  "stockTransfer/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.stockTransfers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return { id, message: response.message };
  },
);

// Moves the actual stock (subtract source / add destination) — server-side
// guarded to only ever apply once per transfer.
export const approveStockTransfer = createAsyncThunk(
  "stockTransfer/approve",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.stockTransfers}/${id}/approve`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertList = (state, transfer) => {
  if (!transfer) return;
  const idx = state.list.findIndex((t) => t.id === transfer.id);
  if (idx !== -1) state.list[idx] = transfer;
  if (state.current?.id === transfer.id) state.current = transfer;
};

const stockTransferSlice = createSlice({
  name: "stockTransfer",
  initialState,
  reducers: {
    clearCurrentStockTransfer: (state) => {
      state.current = null;
      state.loading = false;
    },
    clearStockTransfersList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockTransfers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockTransfers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchStockTransfers.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchStockTransferById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockTransferById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchStockTransferById.rejected, (state, action) => {
        state.loading = false;
        state.current = null;
        state.error = action.payload;
      })
      .addCase(createStockTransfer.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateStockTransfer.fulfilled, (state, action) => upsertList(state, action.payload))
      .addCase(deleteStockTransfer.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload.id);
        state.totalRecords = Math.max(0, (state.totalRecords || 0) - 1);
        if (state.current?.id === action.payload.id) state.current = null;
      })
      .addCase(approveStockTransfer.fulfilled, (state, action) => upsertList(state, action.payload));
  },
});

export const { clearCurrentStockTransfer, clearStockTransfersList } = stockTransferSlice.actions;
export const showStockTransfers = (state) => state.stockTransfer.list;
export const showStockTransfersTotal = (state) => state.stockTransfer.totalRecords;
export const showStockTransfersLoading = (state) => state.stockTransfer.loading;
export const showCurrentStockTransfer = (state) => state.stockTransfer.current;
export const showCurrentStockTransferLoading = (state) => state.stockTransfer.loading;
export default stockTransferSlice.reducer;
