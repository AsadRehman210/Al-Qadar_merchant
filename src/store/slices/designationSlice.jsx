import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, isEmptyListResponse , buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,

  // Paginated dropdown (picker) state — separate from the list-page state
  // above so a page with a Designation <select> doesn't collide with a page
  // showing the full Designations table.
  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
  dropdownLoading: false,
};

export const fetchDesignations = createAsyncThunk(
  "designation/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.designations}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// Paginated dropdown fetch — used only by pages with an actual Designation
// picker (Add/Edit forms, filter bars). Loads DROPDOWN_PAGE_LIMIT at a time,
// appending on scroll (page > 1) rather than replacing.
export const fetchDesignationsDropdown = createAsyncThunk(
  "designation/fetchDropdown",
  async ({ page = 1, search = "", departmentId } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, departmentId });
    const response = await erpGet(`${erpUrls.designations}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchDesignationById = createAsyncThunk(
  "designation/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.designations}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createDesignation = createAsyncThunk(
  "designation/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.designations, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateDesignation = createAsyncThunk(
  "designation/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.designations}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const designationSlice = createSlice({
  name: "designation",
  initialState,
  reducers: {
    clearCurrentDesignation: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchDesignations.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchDesignationById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchDesignationById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchDesignationById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchDesignationsDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchDesignationsDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchDesignationsDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createDesignation.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateDesignation.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      });
  },
});

export const { clearCurrentDesignation } = designationSlice.actions;
export const showDesignations = (state) => state.designation.list;
export const showDesignationsTotal = (state) => state.designation.totalRecords;
export const showDesignationsLoading = (state) => state.designation.loading;
export const showCurrentDesignation = (state) => state.designation.current;
export const showCurrentDesignationLoading = (state) => state.designation.currentLoading;
export const showDesignationDropdownOptions = (state) => state.designation.dropdownOptions;
export const showDesignationDropdownPage = (state) => state.designation.dropdownPage;
export const showDesignationDropdownHasMore = (state) => state.designation.dropdownHasMore;
export const showDesignationDropdownLoading = (state) => state.designation.dropdownLoading;
export default designationSlice.reducer;
