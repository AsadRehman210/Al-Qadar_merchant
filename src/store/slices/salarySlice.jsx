import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, isEmptyListResponse } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  filterMonth: null,
  filterYear: null,
  currentPage: 1,
  current: null,
  history: [],
  loading: false,
  error: null,
};

// Salary has no flat list-all/get-by-id endpoint on the backend — every
// lookup is scoped to one employee (getCurrent/getHistory), so these thunks
// take an employeeId rather than a salary record id.
export const fetchCurrentSalary = createAsyncThunk(
  "salary/fetchCurrent",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.salaries}/employee/${employeeId}`);
    if (isEmptyListResponse(response)) return null;
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchSalaryHistory = createAsyncThunk(
  "salary/fetchHistory",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.salaries}/employee/${employeeId}/history`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createSalary = createAsyncThunk(
  "salary/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.salaries, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateSalary = createAsyncThunk(
  "salary/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.salaries}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const salarySlice = createSlice({
  name: "salary",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
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
    clearCurrentSalary: (state) => {
      state.current = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentSalary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSalary.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentSalary.rejected, (state, action) => {
        state.loading = false;
        state.current = null;
        state.error = action.payload;
      })
      .addCase(fetchSalaryHistory.fulfilled, (state, action) => {
        state.history = action.payload || [];
      })
      .addCase(createSalary.fulfilled, (state, action) => {
        state.current = action.payload;
        if (action.payload) state.history.unshift(action.payload);
      })
      .addCase(updateSalary.fulfilled, (state, action) => {
        state.current = action.payload;
        const idx = state.history.findIndex((h) => h.id === action.payload?.id);
        if (idx !== -1) state.history[idx] = action.payload;
      });
  },
});

export const {
  setSearch,
  setFilterStatus,
  setFilterMonth,
  setFilterYear,
  setCurrentPage,
  clearCurrentSalary,
} = salarySlice.actions;
export const showSearch = (state) => state.salary.search;
export const showFilterStatus = (state) => state.salary.filterStatus;
export const showFilterMonth = (state) => state.salary.filterMonth;
export const showFilterYear = (state) => state.salary.filterYear;
export const showCurrentPage = (state) => state.salary.currentPage;
export const showCurrentSalary = (state) => state.salary.current;
export const showSalaryHistory = (state) => state.salary.history;
export const showSalaryLoading = (state) => state.salary.loading;
export default salarySlice.reducer;
