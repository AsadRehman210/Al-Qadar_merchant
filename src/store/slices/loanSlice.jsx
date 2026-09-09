import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterLoanType: null,
  currentPage: 1,
  list: [],
  totalRecords: 0,
  current: null,
  currentLoading: false,
  employeeLoans: [],
  employeeLoansLoading: false,
  loading: false,
  error: null,
};

export const fetchLoans = createAsyncThunk(
  "loan/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.loans}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchLoanById = createAsyncThunk(
  "loan/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.loans}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchLoansByEmployee = createAsyncThunk(
  "loan/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.loans}/employee/${employeeId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const applyLoan = createAsyncThunk(
  "loan/apply",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.loans, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const patchAction = (name, path) =>
  createAsyncThunk(`loan/${name}`, async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.loans}/${id}/${path}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  });

export const managerApprove = patchAction("managerApprove", "manager-approve");
export const managerReject = patchAction("managerReject", "manager-reject");
export const hrApprove = patchAction("hrApprove", "hr-approve");
export const hrReject = patchAction("hrReject", "hr-reject");
export const disburseLoan = patchAction("disburse", "disburse");
export const preCloseLoan = patchAction("preClose", "preclose");

export const recordRepayment = createAsyncThunk(
  "loan/recordRepayment",
  async ({ id, installmentNo }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.loans}/${id}/repayment/${installmentNo}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertList = (state, loan) => {
  if (!loan) return;
  const idx = state.list.findIndex((l) => l.id === loan.id);
  if (idx !== -1) state.list[idx] = loan;
  if (state.current?.id === loan.id) state.current = loan;
};

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setFilterLoanType: (state, action) => {
      state.filterLoanType = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearCurrentLoan: (state) => {
      state.current = null;
    },
    clearEmployeeLoans: (state) => {
      state.employeeLoans = [];
      state.employeeLoansLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchLoanById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchLoanById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchLoanById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchLoansByEmployee.pending, (state) => {
        state.employeeLoansLoading = true;
      })
      .addCase(fetchLoansByEmployee.fulfilled, (state, action) => {
        state.employeeLoansLoading = false;
        state.employeeLoans = action.payload;
      })
      .addCase(fetchLoansByEmployee.rejected, (state) => {
        state.employeeLoansLoading = false;
        state.employeeLoans = [];
      })
      .addCase(applyLoan.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addMatcher(
        (action) =>
          [
            managerApprove.fulfilled.type,
            managerReject.fulfilled.type,
            hrApprove.fulfilled.type,
            hrReject.fulfilled.type,
            disburseLoan.fulfilled.type,
            preCloseLoan.fulfilled.type,
            recordRepayment.fulfilled.type,
          ].includes(action.type),
        (state, action) => upsertList(state, action.payload),
      );
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterLoanType,
  setCurrentPage,
  clearCurrentLoan,
  clearEmployeeLoans,
} = loanSlice.actions;
export const showSearch = (state) => state.loan.search;
export const showFilterStatus = (state) => state.loan.filterStatus;
export const showFilterLoanType = (state) => state.loan.filterLoanType;
export const showCurrentPage = (state) => state.loan.currentPage;
export const showLoans = (state) => state.loan.list;
export const showLoansTotal = (state) => state.loan.totalRecords;
export const showLoansLoading = (state) => state.loan.loading;
export const showCurrentLoan = (state) => state.loan.current;
export const showCurrentLoanLoading = (state) => state.loan.currentLoading;
export const showEmployeeLoans = (state) => state.loan.employeeLoans;
export const showEmployeeLoansLoading = (state) => state.loan.employeeLoansLoading;
export default loanSlice.reducer;
