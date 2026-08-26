import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterType: null,
  currentPage: 1,
  lastUpdated: null,

  requests: [],
  requestsTotal: 0,
  requestsLoading: false,
  requestsSummary: { total: 0, pendingManager: 0, pendingHr: 0, approved: 0, rejected: 0 },
  currentRequest: null,
  currentRequestLoading: false,
  requestsByEmployee: [],
};

export const fetchRequests = createAsyncThunk(
  "request/fetchRequests",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.employeeRequests}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchRequestsSummary = createAsyncThunk(
  "request/fetchSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.employeeRequests}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchRequestById = createAsyncThunk(
  "request/fetchRequestById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.employeeRequests}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchRequestsByEmployee = createAsyncThunk(
  "request/fetchRequestsByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.employeeRequests}/employee/${employeeId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const applyRequest = createAsyncThunk(
  "request/apply",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.employeeRequests, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const requestPatchAction = (name, path) =>
  createAsyncThunk(`request/${name}`, async ({ id, data } = {}, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.employeeRequests}/${id}/${path}`, data || {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  });

export const managerApproveRequest = requestPatchAction("managerApprove", "manager-approve");
export const managerRejectRequest = requestPatchAction("managerReject", "manager-reject");
export const hrApproveRequest = requestPatchAction("hrApprove", "hr-approve");
export const hrRejectRequest = requestPatchAction("hrReject", "hr-reject");
export const cancelRequest = requestPatchAction("cancel", "cancel");

const upsertRequest = (state, req) => {
  if (!req) return;
  const idx = state.requests.findIndex((r) => r.id === req.id);
  if (idx !== -1) state.requests[idx] = req;
  if (state.currentRequest?.id === req.id) state.currentRequest = req;
};

const requestSlice = createSlice({
  name: "request",
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    setFilterStatus: (state, action) => { state.filterStatus = action.payload; },
    setFilterType: (state, action) => { state.filterType = action.payload; },
    setCurrentPage: (state, action) => { state.currentPage = action.payload; },
    triggerRefresh: (state) => { state.lastUpdated = Date.now(); },
    clearCurrentRequest: (state) => { state.currentRequest = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => { state.requestsLoading = true; })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requests = action.payload.result || [];
        state.requestsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchRequests.rejected, (state) => {
        state.requestsLoading = false;
        state.requests = [];
        state.requestsTotal = 0;
      })
      .addCase(fetchRequestsSummary.fulfilled, (state, action) => {
        if (action.payload) state.requestsSummary = action.payload;
      })
      .addCase(fetchRequestById.pending, (state) => { state.currentRequestLoading = true; })
      .addCase(fetchRequestById.fulfilled, (state, action) => {
        state.currentRequestLoading = false;
        state.currentRequest = action.payload;
      })
      .addCase(fetchRequestById.rejected, (state) => { state.currentRequestLoading = false; })
      .addCase(fetchRequestsByEmployee.fulfilled, (state, action) => {
        state.requestsByEmployee = action.payload || [];
      })
      .addCase(fetchRequestsByEmployee.rejected, (state) => { state.requestsByEmployee = []; })
      .addCase(applyRequest.fulfilled, (state, action) => {
        if (action.payload) state.requests.unshift(action.payload);
        state.lastUpdated = Date.now();
      })
      .addMatcher(
        (action) =>
          [
            managerApproveRequest.fulfilled.type,
            managerRejectRequest.fulfilled.type,
            hrApproveRequest.fulfilled.type,
            hrRejectRequest.fulfilled.type,
            cancelRequest.fulfilled.type,
          ].includes(action.type),
        (state, action) => { upsertRequest(state, action.payload); state.lastUpdated = Date.now(); },
      );
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterType,
  setCurrentPage,
  triggerRefresh,
  clearCurrentRequest,
} = requestSlice.actions;

export const showSearch = (s) => s.request.search;
export const showFilterStatus = (s) => s.request.filterStatus;
export const showFilterType = (s) => s.request.filterType;
export const showCurrentPage = (s) => s.request.currentPage;
export const showLastUpdated = (s) => s.request.lastUpdated;

export const showRequests = (s) => s.request.requests;
export const showRequestsTotal = (s) => s.request.requestsTotal;
export const showRequestsLoading = (s) => s.request.requestsLoading;
export const showRequestsSummary = (s) => s.request.requestsSummary;
export const showCurrentRequest = (s) => s.request.currentRequest;
export const showCurrentRequestLoading = (s) => s.request.currentRequestLoading;
export const showRequestsByEmployee = (s) => s.request.requestsByEmployee;

export default requestSlice.reducer;
