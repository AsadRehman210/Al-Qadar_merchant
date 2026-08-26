import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  search: "",
  filterStatus: null,
  currentPage: 1,
  currentEmployee: null,
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk(
  "employee/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.employees}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchEmployeeById = createAsyncThunk(
  "employee/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.employees}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createEmployee = createAsyncThunk(
  "employee/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.employees, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateEmployee = createAsyncThunk(
  "employee/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.employees}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteEmployee = createAsyncThunk(
  "employee/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.employees}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setCurrentEmployee: (state, action) => {
      state.currentEmployee = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.currentEmployee = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.currentEmployee = action.payload;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload);
      });
  },
});

export const { setSearch, setFilterStatus, setCurrentPage, setCurrentEmployee } = employeeSlice.actions;
export const showSearch = (state) => state.employee.search;
export const showFilterStatus = (state) => state.employee.filterStatus;
export const showCurrentPage = (state) => state.employee.currentPage;
export const showCurrentEmployee = (state) => state.employee.currentEmployee;
export const showEmployees = (state) => state.employee.list;
export const showEmployeesTotal = (state) => state.employee.totalRecords;
export const showEmployeesLoading = (state) => state.employee.loading;
export default employeeSlice.reducer;
