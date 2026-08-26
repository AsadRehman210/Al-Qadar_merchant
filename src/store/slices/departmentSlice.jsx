import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,

  // Paginated dropdown (picker) state — separate from the list-page state
  // above so a page with a Department <select> doesn't collide with a page
  // showing the full Departments table.
  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
  dropdownLoading: false,
};

export const fetchDepartments = createAsyncThunk(
  "department/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.departments}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// Paginated dropdown fetch — used only by pages with an actual Department
// picker (Add/Edit forms, filter bars). Loads DROPDOWN_PAGE_LIMIT at a time,
// appending on scroll (page > 1) rather than replacing.
export const fetchDepartmentsDropdown = createAsyncThunk(
  "department/fetchDropdown",
  async ({ page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.departments}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchDepartmentById = createAsyncThunk(
  "department/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.departments}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createDepartment = createAsyncThunk(
  "department/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.departments, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateDepartment = createAsyncThunk(
  "department/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.departments}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteDepartment = createAsyncThunk(
  "department/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.departments}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    clearCurrentDepartment: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchDepartmentById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchDepartmentById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchDepartmentsDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchDepartmentsDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchDepartmentsDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list = state.list.filter((d) => d.id !== action.payload);
      });
  },
});

export const { clearCurrentDepartment } = departmentSlice.actions;
export const showDepartments = (state) => state.department.list;
export const showDepartmentsTotal = (state) => state.department.totalRecords;
export const showDepartmentsLoading = (state) => state.department.loading;
export const showCurrentDepartment = (state) => state.department.current;
export const showCurrentDepartmentLoading = (state) => state.department.currentLoading;
export const showDepartmentDropdownOptions = (state) => state.department.dropdownOptions;
export const showDepartmentDropdownPage = (state) => state.department.dropdownPage;
export const showDepartmentDropdownHasMore = (state) => state.department.dropdownHasMore;
export const showDepartmentDropdownLoading = (state) => state.department.dropdownLoading;
export default departmentSlice.reducer;
