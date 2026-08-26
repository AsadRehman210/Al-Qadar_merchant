import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  categoryList: [],
  categoryTotal: 0,
  categoryLoading: false,

  assetList: [],
  assetTotal: 0,
  assetLoading: false,
  assetCurrent: null,
  assetCurrentLoading: false,
  assetLocations: [],
  assetSummary: { total: 0, totalPurchaseCost: 0, totalBookValue: 0, byStatus: {} },
  assetAlertsList: [],

  requestList: [],
  requestTotal: 0,
  requestLoading: false,

  auditList: [],
  auditTotal: 0,
  auditLoading: false,
  activeAudit: null,
  activeAuditLoading: false,
};

// ─── Asset Categories ───────────────────────────────────────────────────────
export const fetchAssetCategories = createAsyncThunk(
  "asset/fetchAssetCategories",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 100, ...params });
    const response = await erpGet(`${erpUrls.assetCategories}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createAssetCategory = createAsyncThunk(
  "asset/createAssetCategory",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.assetCategories, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAssetCategory = createAsyncThunk(
  "asset/updateAssetCategory",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.assetCategories}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteAssetCategory = createAsyncThunk(
  "asset/deleteAssetCategory",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.assetCategories}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

// ─── Assets — create/list/get/update plus one action endpoint per lifecycle
// event (assign/return/maintenance/insurance/transfer-location/documents/
// dispose), mirroring Stock Issue/Production's own action-endpoint style. ──
export const fetchAssets = createAsyncThunk(
  "asset/fetchAssets",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.assets}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// AssetAlerts needs every asset's own insurance/warranty/maintenance dates
// to scan for what's expiring soon — a real paginated fetch (one page) can't
// answer that, so it gets its own uncapped, separately-stored fetch instead
// of sharing assetList/assetTotal with the (now server-paginated) register.
export const fetchAssetsForAlerts = createAsyncThunk(
  "asset/fetchAssetsForAlerts",
  async (_params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000 });
    const response = await erpGet(`${erpUrls.assets}?${query}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

// Stat cards above the list — reflects the whole tenant register regardless
// of the list's own search/status/category/location filters.
export const fetchAssetSummary = createAsyncThunk(
  "asset/fetchAssetSummary",
  async (_params, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.assets}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Distinct location strings — backs the location filter dropdown now that
// the main list is server-paginated (no longer has "every asset" in memory
// to derive this from client-side).
export const fetchAssetLocations = createAsyncThunk(
  "asset/fetchAssetLocations",
  async (_params, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.assets}/locations`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const fetchAssetById = createAsyncThunk(
  "asset/fetchAssetById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.assets}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createAsset = createAsyncThunk(
  "asset/createAsset",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.assets, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAsset = createAsyncThunk(
  "asset/updateAsset",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.assets}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const assignAsset = createAsyncThunk(
  "asset/assignAsset",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/assign`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const returnAsset = createAsyncThunk(
  "asset/returnAsset",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/return`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addAssetMaintenance = createAsyncThunk(
  "asset/addAssetMaintenance",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/maintenance`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateAssetInsurance = createAsyncThunk(
  "asset/updateAssetInsurance",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.assets}/${id}/insurance`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const transferAssetLocation = createAsyncThunk(
  "asset/transferAssetLocation",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/transfer-location`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addAssetDocument = createAsyncThunk(
  "asset/addAssetDocument",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/documents`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const removeAssetDocument = createAsyncThunk(
  "asset/removeAssetDocument",
  async ({ id, docId }, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.assets}/${id}/documents/${docId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const disposeAsset = createAsyncThunk(
  "asset/disposeAsset",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assets}/${id}/dispose`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Asset Requests ─────────────────────────────────────────────────────────
export const fetchAssetRequests = createAsyncThunk(
  "asset/fetchAssetRequests",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.assetRequests}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createAssetRequest = createAsyncThunk(
  "asset/createAssetRequest",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.assetRequests, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const decideAssetRequest = createAsyncThunk(
  "asset/decideAssetRequest",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetRequests}/${id}/decide`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fulfillAssetRequest = createAsyncThunk(
  "asset/fulfillAssetRequest",
  async ({ id, assetId }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetRequests}/${id}/fulfill`, { assetId });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Asset Audits (physical stock-take sessions) ───────────────────────────
export const fetchAssetAudits = createAsyncThunk(
  "asset/fetchAssetAudits",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 20, ...params });
    const response = await erpGet(`${erpUrls.assetAudits}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchActiveAssetAudit = createAsyncThunk(
  "asset/fetchActiveAssetAudit",
  async (_params, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.assetAudits}/active`);
    if (isEmptyListResponse(response)) return null;
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const startAssetAudit = createAsyncThunk(
  "asset/startAssetAudit",
  async (_params, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetAudits}/start`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const recordAssetAuditResult = createAsyncThunk(
  "asset/recordAssetAuditResult",
  async ({ id, assetId, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetAudits}/${id}/result/${assetId}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const completeAssetAudit = createAsyncThunk(
  "asset/completeAssetAudit",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.assetAudits}/${id}/complete`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const assetSlice = createSlice({
  name: "asset",
  initialState,
  reducers: {
    clearCurrentAsset: (state) => {
      state.assetCurrent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetCategories.pending, (state) => {
        state.categoryLoading = true;
      })
      .addCase(fetchAssetCategories.fulfilled, (state, action) => {
        state.categoryLoading = false;
        state.categoryList = action.payload.result || [];
        state.categoryTotal = action.payload.total_records || 0;
      })
      .addCase(fetchAssetCategories.rejected, (state) => {
        state.categoryLoading = false;
        state.categoryList = [];
      })
      .addCase(createAssetCategory.fulfilled, (state, action) => {
        if (action.payload) state.categoryList.unshift(action.payload);
      })
      .addCase(updateAssetCategory.fulfilled, (state, action) => {
        const idx = state.categoryList.findIndex((c) => c.id === action.payload?.id);
        if (idx !== -1) state.categoryList[idx] = action.payload;
      })
      .addCase(deleteAssetCategory.fulfilled, (state, action) => {
        state.categoryList = state.categoryList.filter((c) => c.id !== action.payload);
      })

      .addCase(fetchAssets.pending, (state) => {
        state.assetLoading = true;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.assetLoading = false;
        state.assetList = action.payload.result || [];
        state.assetTotal = action.payload.total_records || 0;
      })
      .addCase(fetchAssets.rejected, (state) => {
        state.assetLoading = false;
        state.assetList = [];
      })
      .addCase(fetchAssetLocations.fulfilled, (state, action) => {
        state.assetLocations = action.payload || [];
      })
      .addCase(fetchAssetSummary.fulfilled, (state, action) => {
        if (action.payload) state.assetSummary = action.payload;
      })
      .addCase(fetchAssetsForAlerts.fulfilled, (state, action) => {
        state.assetAlertsList = action.payload || [];
      })
      .addCase(fetchAssetById.pending, (state) => {
        state.assetCurrentLoading = true;
      })
      .addCase(fetchAssetById.fulfilled, (state, action) => {
        state.assetCurrentLoading = false;
        state.assetCurrent = action.payload;
      })
      .addCase(fetchAssetById.rejected, (state) => {
        state.assetCurrentLoading = false;
        state.assetCurrent = null;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        if (action.payload) state.assetList.unshift(action.payload);
      })

      .addCase(fetchAssetRequests.pending, (state) => {
        state.requestLoading = true;
      })
      .addCase(fetchAssetRequests.fulfilled, (state, action) => {
        state.requestLoading = false;
        state.requestList = action.payload.result || [];
        state.requestTotal = action.payload.total_records || 0;
      })
      .addCase(fetchAssetRequests.rejected, (state) => {
        state.requestLoading = false;
        state.requestList = [];
      })
      .addCase(createAssetRequest.fulfilled, (state, action) => {
        if (action.payload) state.requestList.unshift(action.payload);
      })

      .addCase(fetchAssetAudits.pending, (state) => {
        state.auditLoading = true;
      })
      .addCase(fetchAssetAudits.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditList = action.payload.result || [];
        state.auditTotal = action.payload.total_records || 0;
      })
      .addCase(fetchAssetAudits.rejected, (state) => {
        state.auditLoading = false;
        state.auditList = [];
      })
      .addCase(fetchActiveAssetAudit.pending, (state) => {
        state.activeAuditLoading = true;
      })
      .addCase(fetchActiveAssetAudit.fulfilled, (state, action) => {
        state.activeAuditLoading = false;
        state.activeAudit = action.payload;
      })
      .addCase(fetchActiveAssetAudit.rejected, (state) => {
        state.activeAuditLoading = false;
        state.activeAudit = null;
      })
      .addCase(startAssetAudit.fulfilled, (state, action) => {
        state.activeAudit = action.payload;
      })

      // All addMatcher calls must come after every addCase in the chain —
      // Redux Toolkit throws at store-creation time otherwise.
      .addMatcher(
        (action) =>
          [
            updateAsset.fulfilled.type,
            assignAsset.fulfilled.type,
            returnAsset.fulfilled.type,
            addAssetMaintenance.fulfilled.type,
            updateAssetInsurance.fulfilled.type,
            transferAssetLocation.fulfilled.type,
            addAssetDocument.fulfilled.type,
            removeAssetDocument.fulfilled.type,
            disposeAsset.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          if (!action.payload) return;
          const idx = state.assetList.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) state.assetList[idx] = action.payload;
          if (state.assetCurrent?.id === action.payload.id) state.assetCurrent = action.payload;
        },
      )
      .addMatcher(
        (action) => [decideAssetRequest.fulfilled.type, fulfillAssetRequest.fulfilled.type].includes(action.type),
        (state, action) => {
          if (!action.payload) return;
          const idx = state.requestList.findIndex((r) => r.id === action.payload.id);
          if (idx !== -1) state.requestList[idx] = action.payload;
        },
      )
      .addMatcher(
        (action) => [recordAssetAuditResult.fulfilled.type, completeAssetAudit.fulfilled.type].includes(action.type),
        (state, action) => {
          if (!action.payload) return;
          if (state.activeAudit?.id === action.payload.id) {
            state.activeAudit = action.payload.status === "In Progress" ? action.payload : null;
          }
        },
      );
  },
});

export const { clearCurrentAsset } = assetSlice.actions;

export const showAssetCategories = (state) => state.asset.categoryList;
export const showAssetCategoriesTotal = (state) => state.asset.categoryTotal;
export const showAssetCategoriesLoading = (state) => state.asset.categoryLoading;

export const showAssets = (state) => state.asset.assetList;
export const showAssetsTotal = (state) => state.asset.assetTotal;
export const showAssetsLoading = (state) => state.asset.assetLoading;
export const showAssetLocations = (state) => state.asset.assetLocations;
export const showAssetSummary = (state) => state.asset.assetSummary;
export const showAssetAlertsList = (state) => state.asset.assetAlertsList;
export const showCurrentAsset = (state) => state.asset.assetCurrent;
export const showCurrentAssetLoading = (state) => state.asset.assetCurrentLoading;

export const showAssetRequests = (state) => state.asset.requestList;
export const showAssetRequestsTotal = (state) => state.asset.requestTotal;
export const showAssetRequestsLoading = (state) => state.asset.requestLoading;

export const showAssetAudits = (state) => state.asset.auditList;
export const showAssetAuditsLoading = (state) => state.asset.auditLoading;
export const showActiveAssetAudit = (state) => state.asset.activeAudit;
export const showActiveAssetAuditLoading = (state) => state.asset.activeAuditLoading;

export default assetSlice.reducer;
