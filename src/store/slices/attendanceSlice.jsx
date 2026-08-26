import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterEmployee: null,
  filterMonth: null,
  filterYear: null,
  currentPage: 1,
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,
  todayStats: { presentToday: 0, absentToday: 0, onLeaveToday: 0 },
};

export const fetchAttendance = createAsyncThunk(
  "attendance/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.attendance}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchAttendanceTodayStats = createAsyncThunk(
  "attendance/fetchTodayStats",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.attendance}/today-stats`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchAttendanceById = createAsyncThunk(
  "attendance/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.attendance}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const markAttendance = createAsyncThunk(
  "attendance/mark",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.attendance, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const markAttendanceBulk = createAsyncThunk(
  "attendance/markBulk",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.attendance}/bulk`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAttendance = createAsyncThunk(
  "attendance/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.attendance}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteAttendance = createAsyncThunk(
  "attendance/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.attendance}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setFilterEmployee: (state, action) => {
      state.filterEmployee = action.payload;
    },
    setFilterMonth: (state, action) => {
      state.filterMonth = action.payload;
    },
    setFilterYear: (state, action) => {
      state.filterYear = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearCurrentAttendance: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchAttendanceById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchAttendanceTodayStats.fulfilled, (state, action) => {
        if (action.payload) state.todayStats = action.payload;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload);
      });
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterEmployee,
  setFilterMonth,
  setFilterYear,
  setCurrentPage,
  clearCurrentAttendance,
} = attendanceSlice.actions;
export const showSearch = (state) => state.attendance.search;
export const showFilterStatus = (state) => state.attendance.filterStatus;
export const showFilterEmployee = (state) => state.attendance.filterEmployee;
export const showFilterMonth = (state) => state.attendance.filterMonth;
export const showFilterYear = (state) => state.attendance.filterYear;
export const showCurrentPage = (state) => state.attendance.currentPage;
export const showAttendanceList = (state) => state.attendance.list;
export const showAttendanceTotal = (state) => state.attendance.totalRecords;
export const showAttendanceTodayStats = (state) => state.attendance.todayStats;
export const showAttendanceLoading = (state) => state.attendance.loading;
export const showCurrentAttendance = (state) => state.attendance.current;
export default attendanceSlice.reducer;
