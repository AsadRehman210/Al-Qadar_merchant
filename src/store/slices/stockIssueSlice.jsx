import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,
};

export const fetchStockIssues = createAsyncThunk(
  "stockIssue/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.stockIssues}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchStockIssueById = createAsyncThunk(
  "stockIssue/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.stockIssues}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Dispatch-and-done — creating immediately subtracts stock server-side, no
// separate approval step and no update/delete endpoint.
export const createStockIssue = createAsyncThunk(
  "stockIssue/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.stockIssues, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const stockIssueSlice = createSlice({
  name: "stockIssue",
  initialState,
  reducers: {
    clearCurrentStockIssue: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchStockIssues.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchStockIssueById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createStockIssue.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      });
  },
});

export const { clearCurrentStockIssue } = stockIssueSlice.actions;
export const showStockIssues = (state) => state.stockIssue.list;
export const showStockIssuesTotal = (state) => state.stockIssue.totalRecords;
export const showStockIssuesLoading = (state) => state.stockIssue.loading;
export const showCurrentStockIssue = (state) => state.stockIssue.current;
export default stockIssueSlice.reducer;
