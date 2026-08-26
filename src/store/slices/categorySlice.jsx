import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,

  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
  dropdownLoading: false,
};

export const fetchCategories = createAsyncThunk(
  "category/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.categories}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchCategoriesDropdown = createAsyncThunk(
  "category/fetchDropdown",
  async ({ page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.categories}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchCategoryById = createAsyncThunk(
  "category/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.categories}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createCategory = createAsyncThunk(
  "category/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.categories, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateCategory = createAsyncThunk(
  "category/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.categories}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.categories}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    clearCurrentCategory: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchCategoryById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchCategoriesDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchCategoriesDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchCategoriesDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearCurrentCategory } = categorySlice.actions;
export const showCategories = (state) => state.category.list;
export const showCategoriesTotal = (state) => state.category.totalRecords;
export const showCategoriesLoading = (state) => state.category.loading;
export const showCurrentCategory = (state) => state.category.current;
export const showCurrentCategoryLoading = (state) => state.category.currentLoading;
export const showCategoryDropdownOptions = (state) => state.category.dropdownOptions;
export const showCategoryDropdownPage = (state) => state.category.dropdownPage;
export const showCategoryDropdownHasMore = (state) => state.category.dropdownHasMore;
export const showCategoryDropdownLoading = (state) => state.category.dropdownLoading;
export default categorySlice.reducer;
