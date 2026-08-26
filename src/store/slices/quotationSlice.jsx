import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpPatch, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,
};

export const fetchQuotations = createAsyncThunk(
  "quotation/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.quotations}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchQuotationById = createAsyncThunk(
  "quotation/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.quotations}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createQuotation = createAsyncThunk(
  "quotation/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.quotations, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateQuotation = createAsyncThunk(
  "quotation/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.quotations}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateQuotationStatus = createAsyncThunk(
  "quotation/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.quotations}/${id}/status`, { status });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Called by Add Sale Invoice once it has actually created a real invoice for
// a quote (batches picked manually in that form) — just links the two
// records and flips the quote to Converted. Never creates anything itself.
export const markQuotationConverted = createAsyncThunk(
  "quotation/markConverted",
  async ({ id, invoiceId }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.quotations}/${id}/mark-converted`, { invoiceId });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteQuotation = createAsyncThunk(
  "quotation/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.quotations}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const upsertList = (state, quotation) => {
  if (!quotation) return;
  const idx = state.list.findIndex((q) => q.id === quotation.id);
  if (idx !== -1) state.list[idx] = quotation;
  if (state.current?.id === quotation.id) state.current = quotation;
};

const quotationSlice = createSlice({
  name: "quotation",
  initialState,
  reducers: {
    clearCurrentQuotation: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchQuotationById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchQuotationById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchQuotationById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createQuotation.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.list = state.list.filter((q) => q.id !== action.payload);
      })
      .addMatcher(
        (action) =>
          [updateQuotation.fulfilled.type, updateQuotationStatus.fulfilled.type, markQuotationConverted.fulfilled.type].includes(
            action.type,
          ),
        (state, action) => upsertList(state, action.payload),
      );
  },
});

export const { clearCurrentQuotation } = quotationSlice.actions;
export const showQuotations = (state) => state.quotation.list;
export const showQuotationsTotal = (state) => state.quotation.totalRecords;
export const showQuotationsLoading = (state) => state.quotation.loading;
export const showCurrentQuotation = (state) => state.quotation.current;
export const showCurrentQuotationLoading = (state) => state.quotation.currentLoading;
export default quotationSlice.reducer;
