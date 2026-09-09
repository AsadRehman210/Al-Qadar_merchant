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
};

export const fetchProducts = createAsyncThunk(
  "product/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.products}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchProductsDropdown = createAsyncThunk(
  "product/fetchDropdown",
  async ({ page = 1, search = "", categoryId, productType } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, categoryId, productType });
    const response = await erpGet(`${erpUrls.products}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchProductById = createAsyncThunk(
  "product/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.products}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createProduct = createAsyncThunk(
  "product/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.products, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createProductsBulk = createAsyncThunk(
  "product/createBulk",
  async (rows, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.products}/bulk`, { rows });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateProduct = createAsyncThunk(
  "product/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.products}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteProduct = createAsyncThunk(
  "product/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.products}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.current = null;
      state.loading = false;
    },
    clearProductsList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
    },
    resetProductDropdown: (state) => {
      state.dropdownOptions = [];
      state.dropdownPage = 1;
      state.dropdownHasMore = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchProductById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchProductsDropdown.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsDropdown.fulfilled, (state, action) => {
        state.loading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchProductsDropdown.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(createProductsBulk.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) state.list.unshift(...action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearCurrentProduct, clearProductsList, resetProductDropdown } = productSlice.actions;
export const showProducts = (state) => state.product.list;
export const showProductsTotal = (state) => state.product.totalRecords;
export const showProductsLoading = (state) => state.product.loading;
export const showCurrentProduct = (state) => state.product.current;
export const showCurrentProductLoading = (state) => state.product.loading;
export const showProductDropdownOptions = (state) => state.product.dropdownOptions;
export const showProductDropdownPage = (state) => state.product.dropdownPage;
export const showProductDropdownHasMore = (state) => state.product.dropdownHasMore;
export const showProductDropdownLoading = (state) => state.product.loading;
export default productSlice.reducer;
