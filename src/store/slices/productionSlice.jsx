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

export const fetchProductionOrders = createAsyncThunk(
  "production/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.production}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchProductionOrderById = createAsyncThunk(
  "production/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.production}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createProductionOrder = createAsyncThunk(
  "production/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.production, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateProductionOrder = createAsyncThunk(
  "production/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.production}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Consumes raw-material lines, produces the output, recomputes weighted-average
// cost — server-guarded to only ever apply once per order.
export const completeProduction = createAsyncThunk(
  "production/complete",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.production}/${id}/complete`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteProductionOrder = createAsyncThunk(
  "production/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.production}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const upsertList = (state, order) => {
  if (!order) return;
  const idx = state.list.findIndex((o) => o.id === order.id);
  if (idx !== -1) state.list[idx] = order;
  if (state.current?.id === order.id) state.current = order;
};

const productionSlice = createSlice({
  name: "production",
  initialState,
  reducers: {
    clearCurrentProductionOrder: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductionOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchProductionOrders.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchProductionOrderById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchProductionOrderById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchProductionOrderById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createProductionOrder.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(deleteProductionOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((o) => o.id !== action.payload);
      })
      .addMatcher(
        (action) => [updateProductionOrder.fulfilled.type, completeProduction.fulfilled.type].includes(action.type),
        (state, action) => upsertList(state, action.payload),
      );
  },
});

export const { clearCurrentProductionOrder } = productionSlice.actions;
export const showProductionOrders = (state) => state.production.list;
export const showProductionOrdersTotal = (state) => state.production.totalRecords;
export const showProductionOrdersLoading = (state) => state.production.loading;
export const showCurrentProductionOrder = (state) => state.production.current;
export const showCurrentProductionOrderLoading = (state) => state.production.currentLoading;
export default productionSlice.reducer;
