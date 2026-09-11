import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
};

export const fetchAssetPurchases = createAsyncThunk(
  "assetPurchase/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.assetPurchases}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchAssetPurchaseById = createAsyncThunk(
  "assetPurchase/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.assetPurchases}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createAssetPurchase = createAsyncThunk(
  "assetPurchase/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.assetPurchases, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAssetPurchase = createAsyncThunk(
  "assetPurchase/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.assetPurchases}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const postAssetPurchase = createAsyncThunk(
  "assetPurchase/post",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetPurchases}/${id}/post`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addAssetPurchasePayment = createAsyncThunk(
  "assetPurchase/addPayment",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetPurchases}/${id}/payments`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteAssetPurchase = createAsyncThunk(
  "assetPurchase/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.assetPurchases}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const assetPurchaseSlice = createSlice({
  name: "assetPurchase",
  initialState,
  reducers: {
    clearCurrentAssetPurchase: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetPurchases.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssetPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAssetPurchases.rejected, (state) => {
        state.loading = false;
        state.list = [];
      })
      .addCase(fetchAssetPurchaseById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssetPurchaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchAssetPurchaseById.rejected, (state) => {
        state.loading = false;
        state.current = null;
      })
      .addCase(createAssetPurchase.fulfilled, (state, action) => {
        if (action.payload) state.current = action.payload;
      })
      .addCase(updateAssetPurchase.fulfilled, (state, action) => {
        if (action.payload) state.current = action.payload;
      })
      .addCase(postAssetPurchase.fulfilled, (state, action) => {
        if (action.payload) state.current = action.payload;
      })
      .addCase(addAssetPurchasePayment.fulfilled, (state, action) => {
        if (action.payload) state.current = action.payload;
      });
  },
});

export const { clearCurrentAssetPurchase } = assetPurchaseSlice.actions;
export const showAssetPurchases = (state) => state.assetPurchase.list;
export const showAssetPurchasesTotal = (state) => state.assetPurchase.totalRecords;
export const showAssetPurchasesLoading = (state) => state.assetPurchase.loading;
export const showCurrentAssetPurchase = (state) => state.assetPurchase.current;
export const showCurrentAssetPurchaseLoading = (state) => state.assetPurchase.loading;
export default assetPurchaseSlice.reducer;
