import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const EMPTY_SUMMARY = { totalWarehouses: 0, activeWarehouses: 0, totalCapacity: 0, totalStockItems: 0 };

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,

  // Filter-aware stat cards — comes back as `misc_data` alongside the same
  // paginated response, computed server-side over the same search/status
  // query as the page itself (not a separate request, not tenant-wide).
  summary: EMPTY_SUMMARY,

  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
  dropdownLoading: false,
};

export const fetchWarehouses = createAsyncThunk(
  "warehouse/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.warehouses}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0, misc_data: EMPTY_SUMMARY };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchWarehousesDropdown = createAsyncThunk(
  "warehouse/fetchDropdown",
  async ({ page = 1, search = "", status } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, status });
    const response = await erpGet(`${erpUrls.warehouses}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchWarehouseById = createAsyncThunk(
  "warehouse/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.warehouses}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createWarehouse = createAsyncThunk(
  "warehouse/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.warehouses, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateWarehouse = createAsyncThunk(
  "warehouse/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.warehouses}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Backend blocks this with a 409 + explanatory message while the warehouse
// still holds stock — surfaced via rejectWithValue so the caller can toast
// the real reason instead of assuming delete always succeeds.
export const deleteWarehouse = createAsyncThunk(
  "warehouse/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.warehouses}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const warehouseSlice = createSlice({
  name: "warehouse",
  initialState,
  reducers: {
    clearCurrentWarehouse: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
        state.summary = action.payload.misc_data || EMPTY_SUMMARY;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.summary = EMPTY_SUMMARY;
        state.error = action.payload;
      })
      .addCase(fetchWarehouseById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchWarehouseById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchWarehouseById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchWarehousesDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchWarehousesDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchWarehousesDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w.id === action.payload?.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.list = state.list.filter((w) => w.id !== action.payload);
      });
  },
});

export const { clearCurrentWarehouse } = warehouseSlice.actions;
export const showWarehouses = (state) => state.warehouse.list;
export const showWarehousesTotal = (state) => state.warehouse.totalRecords;
export const showWarehousesLoading = (state) => state.warehouse.loading;
export const showWarehousesSummary = (state) => state.warehouse.summary;
export const showCurrentWarehouse = (state) => state.warehouse.current;
export const showCurrentWarehouseLoading = (state) => state.warehouse.currentLoading;
export const showWarehouseDropdownOptions = (state) => state.warehouse.dropdownOptions;
export const showWarehouseDropdownPage = (state) => state.warehouse.dropdownPage;
export const showWarehouseDropdownHasMore = (state) => state.warehouse.dropdownHasMore;
export const showWarehouseDropdownLoading = (state) => state.warehouse.dropdownLoading;
export default warehouseSlice.reducer;
