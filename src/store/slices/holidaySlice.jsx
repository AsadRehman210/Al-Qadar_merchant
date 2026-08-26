import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,
  summary: { total: 0, upcoming: 0, next: null },
};

export const fetchHolidays = createAsyncThunk(
  "holiday/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.holidays}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchHolidaysSummary = createAsyncThunk(
  "holiday/fetchSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.holidays}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createHoliday = createAsyncThunk(
  "holiday/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.holidays, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateHoliday = createAsyncThunk(
  "holiday/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.holidays}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteHoliday = createAsyncThunk(
  "holiday/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.holidays}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

export const fetchHolidayForDate = createAsyncThunk(
  "holiday/fetchForDate",
  async (dateStr, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.holidays}/check/${dateStr}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const holidaySlice = createSlice({
  name: "holiday",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(createHoliday.fulfilled, (state, action) => {
        if (action.payload) state.list.push(action.payload);
      })
      .addCase(updateHoliday.fulfilled, (state, action) => {
        const idx = state.list.findIndex((h) => h.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.list = state.list.filter((h) => h.id !== action.payload);
      })
      .addCase(fetchHolidaysSummary.fulfilled, (state, action) => {
        if (action.payload) state.summary = action.payload;
      });
  },
});

export const showHolidays = (state) => state.holiday.list;
export const showHolidaysTotal = (state) => state.holiday.totalRecords;
export const showHolidaysLoading = (state) => state.holiday.loading;
export const showHolidaysSummary = (state) => state.holiday.summary;
export default holidaySlice.reducer;
