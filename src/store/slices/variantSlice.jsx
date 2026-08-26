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

export const fetchVariants = createAsyncThunk(
  "variant/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.variants}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// productId narrows the picker to one product's variants (Product detail's
// inline variant step); productType narrows to Raw Material / Finished
// Product (Production's raw-material vs output pickers); omit both for a
// catalog-wide picker (Sale/Purchase lines).
export const fetchVariantsDropdown = createAsyncThunk(
  "variant/fetchDropdown",
  async ({ page = 1, search = "", productId, productType, warehouseId } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, productId, productType, warehouseId });
    const response = await erpGet(`${erpUrls.variants}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchVariantById = createAsyncThunk(
  "variant/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.variants}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createVariant = createAsyncThunk(
  "variant/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.variants, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateVariant = createAsyncThunk(
  "variant/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.variants}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteVariant = createAsyncThunk(
  "variant/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.variants}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const variantSlice = createSlice({
  name: "variant",
  initialState,
  reducers: {
    clearCurrentVariant: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVariants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVariants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchVariants.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchVariantById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchVariantById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchVariantById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchVariantsDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchVariantsDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchVariantsDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        const idx = state.list.findIndex((v) => v.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        state.list = state.list.filter((v) => v.id !== action.payload);
      });
  },
});

export const { clearCurrentVariant } = variantSlice.actions;
export const showVariants = (state) => state.variant.list;
export const showVariantsTotal = (state) => state.variant.totalRecords;
export const showVariantsLoading = (state) => state.variant.loading;
export const showCurrentVariant = (state) => state.variant.current;
export const showCurrentVariantLoading = (state) => state.variant.currentLoading;
export const showVariantDropdownOptions = (state) => state.variant.dropdownOptions;
export const showVariantDropdownPage = (state) => state.variant.dropdownPage;
export const showVariantDropdownHasMore = (state) => state.variant.dropdownHasMore;
export const showVariantDropdownLoading = (state) => state.variant.dropdownLoading;
export default variantSlice.reducer;
