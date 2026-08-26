import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, buildQuery } from "api/erpClient";

const initialState = {
  hrOverview: null,
  hrOverviewLoading: false,

  attendanceTrend: [],
  attendanceTrendLoading: false,

  inventoryOverview: null,
  inventoryOverviewLoading: false,

  expiryBuckets: null,
  expiryBucketsLoading: false,

  salesOverview: null,
  salesOverviewLoading: false,

  profitTrend: [],
  profitTrendLoading: false,

  topProducts: [],
  topProductsLoading: false,
};

// ─── HR ──────────────────────────────────────────────────────────────────
export const fetchHrOverview = createAsyncThunk(
  "analytics/fetchHrOverview",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.hrAnalytics}/overview?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchAttendanceTrend = createAsyncThunk(
  "analytics/fetchAttendanceTrend",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ days: 14, ...params });
    const response = await erpGet(`${erpUrls.hrAnalytics}/attendance-trend?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Inventory ───────────────────────────────────────────────────────────
export const fetchInventoryOverview = createAsyncThunk(
  "analytics/fetchInventoryOverview",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.inventoryAnalytics}/overview?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchExpiryBuckets = createAsyncThunk(
  "analytics/fetchExpiryBuckets",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.inventoryAnalytics}/expiry?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Sales / Finance ─────────────────────────────────────────────────────
export const fetchSalesOverview = createAsyncThunk(
  "analytics/fetchSalesOverview",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.salesAnalytics}/overview?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchProfitTrend = createAsyncThunk(
  "analytics/fetchProfitTrend",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ months: 12, ...params });
    const response = await erpGet(`${erpUrls.salesAnalytics}/profit-trend?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ limit: 10, ...params });
    const response = await erpGet(`${erpUrls.salesAnalytics}/top-products?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHrOverview.pending, (state) => {
        state.hrOverviewLoading = true;
      })
      .addCase(fetchHrOverview.fulfilled, (state, action) => {
        state.hrOverviewLoading = false;
        state.hrOverview = action.payload;
      })
      .addCase(fetchHrOverview.rejected, (state) => {
        state.hrOverviewLoading = false;
      })

      .addCase(fetchAttendanceTrend.pending, (state) => {
        state.attendanceTrendLoading = true;
      })
      .addCase(fetchAttendanceTrend.fulfilled, (state, action) => {
        state.attendanceTrendLoading = false;
        state.attendanceTrend = action.payload || [];
      })
      .addCase(fetchAttendanceTrend.rejected, (state) => {
        state.attendanceTrendLoading = false;
      })

      .addCase(fetchInventoryOverview.pending, (state) => {
        state.inventoryOverviewLoading = true;
      })
      .addCase(fetchInventoryOverview.fulfilled, (state, action) => {
        state.inventoryOverviewLoading = false;
        state.inventoryOverview = action.payload;
      })
      .addCase(fetchInventoryOverview.rejected, (state) => {
        state.inventoryOverviewLoading = false;
      })

      .addCase(fetchExpiryBuckets.pending, (state) => {
        state.expiryBucketsLoading = true;
      })
      .addCase(fetchExpiryBuckets.fulfilled, (state, action) => {
        state.expiryBucketsLoading = false;
        state.expiryBuckets = action.payload;
      })
      .addCase(fetchExpiryBuckets.rejected, (state) => {
        state.expiryBucketsLoading = false;
      })

      .addCase(fetchSalesOverview.pending, (state) => {
        state.salesOverviewLoading = true;
      })
      .addCase(fetchSalesOverview.fulfilled, (state, action) => {
        state.salesOverviewLoading = false;
        state.salesOverview = action.payload;
      })
      .addCase(fetchSalesOverview.rejected, (state) => {
        state.salesOverviewLoading = false;
      })

      .addCase(fetchProfitTrend.pending, (state) => {
        state.profitTrendLoading = true;
      })
      .addCase(fetchProfitTrend.fulfilled, (state, action) => {
        state.profitTrendLoading = false;
        state.profitTrend = action.payload || [];
      })
      .addCase(fetchProfitTrend.rejected, (state) => {
        state.profitTrendLoading = false;
      })

      .addCase(fetchTopProducts.pending, (state) => {
        state.topProductsLoading = true;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProductsLoading = false;
        state.topProducts = action.payload || [];
      })
      .addCase(fetchTopProducts.rejected, (state) => {
        state.topProductsLoading = false;
      });
  },
});

export const showHrOverview = (state) => state.analytics.hrOverview;
export const showHrOverviewLoading = (state) => state.analytics.hrOverviewLoading;

export const showAttendanceTrend = (state) => state.analytics.attendanceTrend;
export const showAttendanceTrendLoading = (state) => state.analytics.attendanceTrendLoading;

export const showInventoryOverview = (state) => state.analytics.inventoryOverview;
export const showInventoryOverviewLoading = (state) => state.analytics.inventoryOverviewLoading;

export const showExpiryBuckets = (state) => state.analytics.expiryBuckets;
export const showExpiryBucketsLoading = (state) => state.analytics.expiryBucketsLoading;

export const showSalesOverview = (state) => state.analytics.salesOverview;
export const showSalesOverviewLoading = (state) => state.analytics.salesOverviewLoading;

export const showProfitTrend = (state) => state.analytics.profitTrend;
export const showProfitTrendLoading = (state) => state.analytics.profitTrendLoading;

export const showTopProducts = (state) => state.analytics.topProducts;
export const showTopProductsLoading = (state) => state.analytics.topProductsLoading;

export default analyticsSlice.reducer;
