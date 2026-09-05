import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  currentLoading: false,
  error: null,
};

export const fetchQuarantineLots = createAsyncThunk(
  "quarantineLot/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.quarantineLots}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchQuarantineLotById = createAsyncThunk(
  "quarantineLot/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.quarantineLots}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const quarantineLotSlice = createSlice({
  name: "quarantineLot",
  initialState,
  reducers: {
    clearCurrentQuarantineLot: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuarantineLots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuarantineLots.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchQuarantineLots.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchQuarantineLotById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchQuarantineLotById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchQuarantineLotById.rejected, (state) => {
        state.currentLoading = false;
        state.current = null;
      });
  },
});

export const { clearCurrentQuarantineLot } = quarantineLotSlice.actions;
export const showQuarantineLots = (state) => state.quarantineLot.list;
export const showQuarantineLotsTotal = (state) => state.quarantineLot.totalRecords;
export const showQuarantineLotsLoading = (state) => state.quarantineLot.loading;
export const showCurrentQuarantineLot = (state) => state.quarantineLot.current;
export const showCurrentQuarantineLotLoading = (state) => state.quarantineLot.currentLoading;
export default quarantineLotSlice.reducer;
