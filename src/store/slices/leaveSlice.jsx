import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterType: null,
  filterDepartment: null,
  currentPage: 1,
  // used to force re-render after mutable fake-data mutations
  lastUpdated: null,

  list: [],
  totalRecords: 0,
  loading: false,
  current: null,
  employeeLeaves: [],
  balance: [],
  balanceLoading: false,
  summary: { total: 0, pending: 0, pendingManager: 0, pendingHr: 0, approved: 0, rejected: 0 },
};

export const fetchLeaves = createAsyncThunk(
  "leave/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.leaves}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchLeaveSummary = createAsyncThunk(
  "leave/fetchSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.leaves}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchLeaveById = createAsyncThunk(
  "leave/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.leaves}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchLeavesByEmployee = createAsyncThunk(
  "leave/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.leaves}/employee/${employeeId}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchLeaveBalance = createAsyncThunk(
  "leave/fetchBalance",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.leaves}/employee/${employeeId}/balance`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const applyLeave = createAsyncThunk(
  "leave/apply",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.leaves, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const managerApproveLeave = createAsyncThunk(
  "leave/managerApprove",
  async ({ id, comments }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.leaves}/${id}/manager-approve`, { comments });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const managerRejectLeave = createAsyncThunk(
  "leave/managerReject",
  async ({ id, comments }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.leaves}/${id}/manager-reject`, { comments });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const hrApproveLeave = createAsyncThunk(
  "leave/hrApprove",
  async ({ id, comments }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.leaves}/${id}/hr-approve`, { comments });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const hrRejectLeave = createAsyncThunk(
  "leave/hrReject",
  async ({ id, comments }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.leaves}/${id}/hr-reject`, { comments });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const cancelLeaveRequest = createAsyncThunk(
  "leave/cancel",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.leaves}/${id}/cancel`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertInList = (state, payload) => {
  if (!payload) return;
  const idx = state.list.findIndex((x) => x.id === payload.id);
  if (idx !== -1) state.list[idx] = payload;
  if (state.current?.id === payload.id) state.current = payload;
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    setFilterStatus: (state, action) => { state.filterStatus = action.payload; },
    setFilterType: (state, action) => { state.filterType = action.payload; },
    setFilterDepartment: (state, action) => { state.filterDepartment = action.payload; },
    setCurrentPage: (state, action) => { state.currentPage = action.payload; },
    triggerRefresh: (state) => { state.lastUpdated = Date.now(); },
    clearCurrentLeave: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => { state.loading = true; })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchLeaves.rejected, (state) => {
        state.loading = false;
        state.list = [];
        state.totalRecords = 0;
      })
      .addCase(fetchLeaveSummary.fulfilled, (state, action) => {
        if (action.payload) state.summary = action.payload;
      })
      .addCase(fetchLeaveById.pending, (state) => { state.currentLoading = true; })
      .addCase(fetchLeaveById.fulfilled, (state, action) => { state.currentLoading = false; state.current = action.payload; })
      .addCase(fetchLeaveById.rejected, (state) => { state.currentLoading = false; })
      .addCase(fetchLeavesByEmployee.fulfilled, (state, action) => { state.employeeLeaves = action.payload; })
      .addCase(fetchLeaveBalance.pending, (state) => { state.balanceLoading = true; })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchLeaveBalance.rejected, (state) => {
        state.balanceLoading = false;
        state.balance = [];
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(managerApproveLeave.fulfilled, (state, action) => { upsertInList(state, action.payload); state.lastUpdated = Date.now(); })
      .addCase(managerRejectLeave.fulfilled, (state, action) => { upsertInList(state, action.payload); state.lastUpdated = Date.now(); })
      .addCase(hrApproveLeave.fulfilled, (state, action) => { upsertInList(state, action.payload); state.lastUpdated = Date.now(); })
      .addCase(hrRejectLeave.fulfilled, (state, action) => { upsertInList(state, action.payload); state.lastUpdated = Date.now(); })
      .addCase(cancelLeaveRequest.fulfilled, (state, action) => { upsertInList(state, action.payload); state.lastUpdated = Date.now(); });
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterType,
  setFilterDepartment,
  setCurrentPage,
  triggerRefresh,
  clearCurrentLeave,
} = leaveSlice.actions;

export const showSearch = (s) => s.leave.search;
export const showFilterStatus = (s) => s.leave.filterStatus;
export const showFilterType = (s) => s.leave.filterType;
export const showFilterDepartment = (s) => s.leave.filterDepartment;
export const showCurrentPage = (s) => s.leave.currentPage;
export const showLastUpdated = (s) => s.leave.lastUpdated;
export const showLeaves = (s) => s.leave.list;
export const showLeavesTotal = (s) => s.leave.totalRecords;
export const showLeavesLoading = (s) => s.leave.loading;
export const showLeaveSummary = (s) => s.leave.summary;
export const showCurrentLeave = (s) => s.leave.current;
export const showCurrentLeaveLoading = (s) => s.leave.currentLoading;
export const showEmployeeLeaves = (s) => s.leave.employeeLeaves;
export const showLeaveBalance = (s) => s.leave.balance;
export const showLeaveBalanceLoading = (s) => s.leave.balanceLoading;

export default leaveSlice.reducer;
