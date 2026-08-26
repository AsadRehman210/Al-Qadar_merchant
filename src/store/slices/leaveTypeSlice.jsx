import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  loading: false,
  current: null,
};

export const fetchLeaveTypes = createAsyncThunk(
  "leaveType/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.leaveTypes}?${query}`);
    if (isEmptyListResponse(response)) return { result: [] };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createLeaveType = createAsyncThunk(
  "leaveType/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.leaveTypes, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateLeaveType = createAsyncThunk(
  "leaveType/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.leaveTypes}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteLeaveType = createAsyncThunk(
  "leaveType/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.leaveTypes}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const leaveTypeSlice = createSlice({
  name: "leaveType",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveTypes.pending, (state) => { state.loading = true; })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
      })
      .addCase(fetchLeaveTypes.rejected, (state) => {
        state.loading = false;
        state.list = [];
      })
      .addCase(createLeaveType.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateLeaveType.fulfilled, (state, action) => {
        const idx = state.list.findIndex((x) => x.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteLeaveType.fulfilled, (state, action) => {
        state.list = state.list.filter((x) => x.id !== action.payload);
      });
  },
});

export const showLeaveTypes = (s) => s.leaveType.list;
export const showLeaveTypesLoading = (s) => s.leaveType.loading;
export default leaveTypeSlice.reducer;
