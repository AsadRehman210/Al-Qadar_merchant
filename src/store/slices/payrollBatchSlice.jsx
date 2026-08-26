import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpPatch, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterMonth: null,
  currentPage: 1,
  lastUpdated: null,

  runs: [],
  runsTotal: 0,
  runsLoading: false,
  runsSummary: { totalRuns: 0, pendingApproval: 0, paidRuns: 0, totalNetPaid: 0 },
  currentRun: null,
  currentRunLoading: false,
  employeeHistory: [],
  employeeHistoryLoading: false,
  allEmployeesHistory: [],
  allEmployeesHistoryTotal: 0,
  allEmployeesHistoryLoading: false,

  spTypes: [],
  spTypesLoading: false,

  specialPayments: [],
  specialPaymentsTotal: 0,
  specialPaymentsLoading: false,
  specialPaymentsSummary: { totalPaid: 0, paidCount: 0, totalPending: 0, pendingCount: 0, draftCount: 0, totalCount: 0 },
  currentSpecialPayment: null,
  currentSpecialPaymentLoading: false,
};

// ── Payroll Runs ──────────────────────────────────────────

export const fetchPayrollRuns = createAsyncThunk(
  "payrollBatch/fetchRuns",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.payrollRuns}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// Every employee's own line across every real run, flattened server-side
// and genuinely paginated — backs Salary's "no employee filter picked" view
// (was previously `fetchPayrollRuns` fetch-all + client-flatten + client-slice).
export const fetchAllEmployeesPayrollHistory = createAsyncThunk(
  "payrollBatch/fetchAllEmployeesHistory",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.payrollRuns}/employees-history?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchPayrollRunsSummary = createAsyncThunk(
  "payrollBatch/fetchRunsSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.payrollRuns}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchPayrollRunById = createAsyncThunk(
  "payrollBatch/fetchRunById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.payrollRuns}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// One employee's line across every real (non-draft, non-cancelled) payroll
// run — what the Employee Detail page's Month-wise Salary tab shows.
export const fetchPayrollHistoryByEmployee = createAsyncThunk(
  "payrollBatch/fetchHistoryByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.payrollRuns}/employee/${employeeId}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createPayrollRun = createAsyncThunk(
  "payrollBatch/createRun",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.payrollRuns, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const recomputePayrollLine = createAsyncThunk(
  "payrollBatch/recomputeLine",
  async ({ runId, employeeId, data }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.payrollRuns}/${runId}/line/${employeeId}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const runPatchAction = (name, path) =>
  createAsyncThunk(`payrollBatch/${name}`, async ({ id, data } = {}, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.payrollRuns}/${id}/${path}`, data || {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  });

export const submitPayrollRun = runPatchAction("submitRun", "submit");
export const approvePayrollRun = runPatchAction("approveRun", "approve");
export const rejectPayrollRun = runPatchAction("rejectRun", "reject");
export const processPayrollRun = runPatchAction("processRun", "process");
export const markPayrollRunPaid = runPatchAction("markRunPaid", "mark-paid");
export const cancelPayrollRun = runPatchAction("cancelRun", "cancel");

// ── Special Payment Types ─────────────────────────────────

export const fetchSpTypes = createAsyncThunk(
  "payrollBatch/fetchSpTypes",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.specialPaymentTypes}?${query}`);
    if (isEmptyListResponse(response)) return { result: [] };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createSpType = createAsyncThunk(
  "payrollBatch/createSpType",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.specialPaymentTypes, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateSpType = createAsyncThunk(
  "payrollBatch/updateSpType",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.specialPaymentTypes}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteSpType = createAsyncThunk(
  "payrollBatch/deleteSpType",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.specialPaymentTypes}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

// ── Special Payments ──────────────────────────────────────

export const fetchSpecialPayments = createAsyncThunk(
  "payrollBatch/fetchSpecialPayments",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.specialPayments}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSpecialPaymentsSummary = createAsyncThunk(
  "payrollBatch/fetchSpecialPaymentsSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.specialPayments}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchSpecialPaymentById = createAsyncThunk(
  "payrollBatch/fetchSpecialPaymentById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.specialPayments}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createSpecialPayment = createAsyncThunk(
  "payrollBatch/createSpecialPayment",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.specialPayments, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const spPatchAction = (name, path) =>
  createAsyncThunk(`payrollBatch/${name}`, async ({ id, data } = {}, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.specialPayments}/${id}/${path}`, data || {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  });

export const submitSpecialPayment = spPatchAction("submitSp", "submit");
export const approveSpecialPayment = spPatchAction("approveSp", "approve");
export const rejectSpecialPayment = spPatchAction("rejectSp", "reject");
export const markSpecialPaymentPaid = spPatchAction("markSpPaid", "mark-paid");
export const cancelSpecialPayment = spPatchAction("cancelSp", "cancel");

// ── Slice ──────────────────────────────────────────────────

const upsertRun = (state, run) => {
  if (!run) return;
  const idx = state.runs.findIndex((r) => r.id === run.id);
  if (idx !== -1) state.runs[idx] = run;
  if (state.currentRun?.id === run.id) state.currentRun = run;
};

const upsertSp = (state, sp) => {
  if (!sp) return;
  const idx = state.specialPayments.findIndex((p) => p.id === sp.id);
  if (idx !== -1) state.specialPayments[idx] = sp;
  if (state.currentSpecialPayment?.id === sp.id) state.currentSpecialPayment = sp;
};

const payrollBatchSlice = createSlice({
  name: "payrollBatch",
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    setFilterStatus: (state, action) => { state.filterStatus = action.payload; },
    setFilterMonth: (state, action) => { state.filterMonth = action.payload; },
    setCurrentPage: (state, action) => { state.currentPage = action.payload; },
    triggerRefresh: (state) => { state.lastUpdated = Date.now(); },
    clearCurrentRun: (state) => { state.currentRun = null; },
    clearEmployeeHistory: (state) => { state.employeeHistory = []; },
    clearCurrentSpecialPayment: (state) => { state.currentSpecialPayment = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollRuns.pending, (state) => { state.runsLoading = true; })
      .addCase(fetchPayrollRuns.fulfilled, (state, action) => {
        state.runsLoading = false;
        state.runs = action.payload.result || [];
        state.runsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchPayrollRuns.rejected, (state) => {
        state.runsLoading = false;
        state.runs = [];
        state.runsTotal = 0;
      })
      .addCase(fetchPayrollRunsSummary.fulfilled, (state, action) => {
        if (action.payload) state.runsSummary = action.payload;
      })
      .addCase(fetchAllEmployeesPayrollHistory.pending, (state) => { state.allEmployeesHistoryLoading = true; })
      .addCase(fetchAllEmployeesPayrollHistory.fulfilled, (state, action) => {
        state.allEmployeesHistoryLoading = false;
        state.allEmployeesHistory = action.payload.result || [];
        state.allEmployeesHistoryTotal = action.payload.total_records || 0;
      })
      .addCase(fetchAllEmployeesPayrollHistory.rejected, (state) => {
        state.allEmployeesHistoryLoading = false;
        state.allEmployeesHistory = [];
        state.allEmployeesHistoryTotal = 0;
      })
      .addCase(fetchPayrollRunById.pending, (state) => { state.currentRunLoading = true; })
      .addCase(fetchPayrollRunById.fulfilled, (state, action) => {
        state.currentRunLoading = false;
        state.currentRun = action.payload;
      })
      .addCase(fetchPayrollRunById.rejected, (state) => { state.currentRunLoading = false; })
      .addCase(fetchPayrollHistoryByEmployee.pending, (state) => { state.employeeHistoryLoading = true; })
      .addCase(fetchPayrollHistoryByEmployee.fulfilled, (state, action) => {
        state.employeeHistoryLoading = false;
        state.employeeHistory = action.payload || [];
      })
      .addCase(fetchPayrollHistoryByEmployee.rejected, (state) => {
        state.employeeHistoryLoading = false;
        state.employeeHistory = [];
      })
      .addCase(createPayrollRun.fulfilled, (state, action) => {
        if (action.payload) state.runs.unshift(action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(fetchSpTypes.pending, (state) => { state.spTypesLoading = true; })
      .addCase(fetchSpTypes.fulfilled, (state, action) => {
        state.spTypesLoading = false;
        state.spTypes = action.payload.result || [];
      })
      .addCase(fetchSpTypes.rejected, (state) => {
        state.spTypesLoading = false;
        state.spTypes = [];
      })
      .addCase(createSpType.fulfilled, (state, action) => {
        if (action.payload) state.spTypes.unshift(action.payload);
      })
      .addCase(updateSpType.fulfilled, (state, action) => {
        const idx = state.spTypes.findIndex((t) => t.id === action.payload?.id);
        if (idx !== -1) state.spTypes[idx] = action.payload;
      })
      .addCase(deleteSpType.fulfilled, (state, action) => {
        state.spTypes = state.spTypes.filter((t) => t.id !== action.payload);
      })
      .addCase(fetchSpecialPayments.pending, (state) => { state.specialPaymentsLoading = true; })
      .addCase(fetchSpecialPayments.fulfilled, (state, action) => {
        state.specialPaymentsLoading = false;
        state.specialPayments = action.payload.result || [];
        state.specialPaymentsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchSpecialPayments.rejected, (state) => {
        state.specialPaymentsLoading = false;
        state.specialPayments = [];
        state.specialPaymentsTotal = 0;
      })
      .addCase(fetchSpecialPaymentsSummary.fulfilled, (state, action) => {
        if (action.payload) state.specialPaymentsSummary = action.payload;
      })
      .addCase(fetchSpecialPaymentById.pending, (state) => { state.currentSpecialPaymentLoading = true; })
      .addCase(fetchSpecialPaymentById.fulfilled, (state, action) => {
        state.currentSpecialPaymentLoading = false;
        state.currentSpecialPayment = action.payload;
      })
      .addCase(fetchSpecialPaymentById.rejected, (state) => { state.currentSpecialPaymentLoading = false; })
      .addCase(createSpecialPayment.fulfilled, (state, action) => {
        if (action.payload) state.specialPayments.unshift(action.payload);
        state.lastUpdated = Date.now();
      })
      .addMatcher(
        (action) =>
          [
            recomputePayrollLine.fulfilled.type,
            submitPayrollRun.fulfilled.type,
            approvePayrollRun.fulfilled.type,
            rejectPayrollRun.fulfilled.type,
            processPayrollRun.fulfilled.type,
            markPayrollRunPaid.fulfilled.type,
            cancelPayrollRun.fulfilled.type,
          ].includes(action.type),
        (state, action) => { upsertRun(state, action.payload); state.lastUpdated = Date.now(); },
      )
      .addMatcher(
        (action) =>
          [
            submitSpecialPayment.fulfilled.type,
            approveSpecialPayment.fulfilled.type,
            rejectSpecialPayment.fulfilled.type,
            markSpecialPaymentPaid.fulfilled.type,
            cancelSpecialPayment.fulfilled.type,
          ].includes(action.type),
        (state, action) => { upsertSp(state, action.payload); state.lastUpdated = Date.now(); },
      );
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterMonth,
  setCurrentPage,
  triggerRefresh,
  clearCurrentRun,
  clearEmployeeHistory,
  clearCurrentSpecialPayment,
} = payrollBatchSlice.actions;

export const showLastUpdated = (state) => state.payrollBatch.lastUpdated;

export const showRuns = (state) => state.payrollBatch.runs;
export const showRunsTotal = (state) => state.payrollBatch.runsTotal;
export const showRunsLoading = (state) => state.payrollBatch.runsLoading;
export const showAllEmployeesPayrollHistory = (state) => state.payrollBatch.allEmployeesHistory;
export const showAllEmployeesPayrollHistoryTotal = (state) => state.payrollBatch.allEmployeesHistoryTotal;
export const showAllEmployeesPayrollHistoryLoading = (state) => state.payrollBatch.allEmployeesHistoryLoading;
export const showRunsSummary = (state) => state.payrollBatch.runsSummary;
export const showCurrentRun = (state) => state.payrollBatch.currentRun;
export const showCurrentRunLoading = (state) => state.payrollBatch.currentRunLoading;
export const showEmployeePayrollHistory = (state) => state.payrollBatch.employeeHistory;
export const showEmployeePayrollHistoryLoading = (state) => state.payrollBatch.employeeHistoryLoading;

export const showSpTypes = (state) => state.payrollBatch.spTypes;
export const showSpTypesLoading = (state) => state.payrollBatch.spTypesLoading;

export const showSpecialPayments = (state) => state.payrollBatch.specialPayments;
export const showSpecialPaymentsTotal = (state) => state.payrollBatch.specialPaymentsTotal;
export const showSpecialPaymentsLoading = (state) => state.payrollBatch.specialPaymentsLoading;
export const showSpecialPaymentsSummary = (state) => state.payrollBatch.specialPaymentsSummary;
export const showCurrentSpecialPayment = (state) => state.payrollBatch.currentSpecialPayment;
export const showCurrentSpecialPaymentLoading = (state) => state.payrollBatch.currentSpecialPaymentLoading;

export default payrollBatchSlice.reducer;
