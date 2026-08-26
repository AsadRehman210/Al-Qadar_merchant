import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterExpenseType: null,
  filterPaymentStatus: null,
  currentPage: 1,
  // used to force re-render after mutable fake-data mutations
  lastUpdated: null,
  list: [],
  totalRecords: 0,
  current: null,
  employeeExpenses: [],
  loading: false,
  error: null,
};

export const fetchExpenses = createAsyncThunk(
  "expense/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.expenses}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchExpenseById = createAsyncThunk(
  "expense/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.expenses}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchExpensesByEmployee = createAsyncThunk(
  "expense/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.expenses}/employee/${employeeId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const applyExpense = createAsyncThunk(
  "expense/apply",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.expenses, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const patchAction = (name, path) =>
  createAsyncThunk(name, async ({ id, comments }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.expenses}/${id}/${path}`, comments ? { comments } : {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  });

export const managerApproveExpense = patchAction("expense/managerApprove", "manager-approve");
export const managerRejectExpense = patchAction("expense/managerReject", "manager-reject");
export const hrApproveExpense = patchAction("expense/hrApprove", "hr-approve");
export const hrRejectExpense = patchAction("expense/hrReject", "hr-reject");

export const markExpenseReimbursed = createAsyncThunk(
  "expense/markReimbursed",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.expenses}/${id}/reimburse`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setFilterExpenseType: (state, action) => {
      state.filterExpenseType = action.payload;
    },
    setFilterPaymentStatus: (state, action) => {
      state.filterPaymentStatus = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    triggerRefresh: (state) => {
      state.lastUpdated = Date.now();
    },
    clearCurrentExpense: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    const upsertCurrent = (state, action) => {
      state.current = action.payload;
      const idx = state.list.findIndex((e) => e.id === action.payload?.id);
      if (idx !== -1) state.list[idx] = action.payload;
    };
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchExpenseById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchExpenseById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchExpensesByEmployee.fulfilled, (state, action) => {
        state.employeeExpenses = action.payload;
      })
      .addCase(applyExpense.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(managerApproveExpense.fulfilled, upsertCurrent)
      .addCase(managerRejectExpense.fulfilled, upsertCurrent)
      .addCase(hrApproveExpense.fulfilled, upsertCurrent)
      .addCase(hrRejectExpense.fulfilled, upsertCurrent)
      .addCase(markExpenseReimbursed.fulfilled, upsertCurrent);
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterExpenseType,
  setFilterPaymentStatus,
  setCurrentPage,
  triggerRefresh,
  clearCurrentExpense,
} = expenseSlice.actions;
export const showSearch = (state) => state.expense.search;
export const showFilterStatus = (state) => state.expense.filterStatus;
export const showFilterExpenseType = (state) => state.expense.filterExpenseType;
export const showFilterPaymentStatus = (state) => state.expense.filterPaymentStatus;
export const showCurrentPage = (state) => state.expense.currentPage;
export const showLastUpdated = (state) => state.expense.lastUpdated;
export const showExpenses = (state) => state.expense.list;
export const showExpensesTotal = (state) => state.expense.totalRecords;
export const showExpensesLoading = (state) => state.expense.loading;
export const showCurrentExpense = (state) => state.expense.current;
export const showCurrentExpenseLoading = (state) => state.expense.currentLoading;
export const showEmployeeExpenses = (state) => state.expense.employeeExpenses;
export default expenseSlice.reducer;
