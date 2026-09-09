import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, isEmptyListResponse } from "api/erpClient";

const initialState = {
  list: [],
  current: null,
  loading: false,
  currentLoading: false,
  error: null,
};

export const fetchAttendancePolicies = createAsyncThunk(
  "attendancePolicy/fetchAll",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(erpUrls.attendancePolicies);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchCurrentAttendancePolicy = createAsyncThunk(
  "attendancePolicy/fetchCurrent",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.attendancePolicies}/current`);
    if (response?.success === false && response?.error_code === 404) return null;
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchAttendancePolicyById = createAsyncThunk(
  "attendancePolicy/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.attendancePolicies}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// The backend upserts: creating a new policy auto-closes (stamps endDate on)
// whichever one was active, same semantics the old local storage helper had.
export const createAttendancePolicy = createAsyncThunk(
  "attendancePolicy/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.attendancePolicies, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAttendancePolicy = createAsyncThunk(
  "attendancePolicy/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.attendancePolicies}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const attendancePolicySlice = createSlice({
  name: "attendancePolicy",
  initialState,
  reducers: {
    clearCurrentAttendancePolicy: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendancePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendancePolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchAttendancePolicies.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchCurrentAttendancePolicy.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchCurrentAttendancePolicy.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentAttendancePolicy.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchAttendancePolicyById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchAttendancePolicyById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchAttendancePolicyById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(updateAttendancePolicy.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      });
  },
});

export const { clearCurrentAttendancePolicy } = attendancePolicySlice.actions;
export const showAttendancePolicies = (state) => state.attendancePolicy.list;
export const showAttendancePoliciesLoading = (state) => state.attendancePolicy.loading;
export const showCurrentAttendancePolicy = (state) => state.attendancePolicy.current;
export const showCurrentAttendancePolicyLoading = (state) => state.attendancePolicy.currentLoading;
export default attendancePolicySlice.reducer;
