import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  exits: [],
  exitsTotal: 0,
  exitsLoading: false,
  exitsSummary: { total: 0, noticePeriod: 0, clearance: 0, settlement: 0, completed: 0 },
  currentExit: null,
  settlementPreview: null,
};

export const fetchExits = createAsyncThunk(
  "offboarding/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.exits}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchExitsSummary = createAsyncThunk(
  "offboarding/fetchSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.exits}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchExitById = createAsyncThunk(
  "offboarding/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.exits}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchActiveExitForEmployee = createAsyncThunk(
  "offboarding/fetchActiveForEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.exits}/employee/${employeeId}/active`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const initiateExit = createAsyncThunk(
  "offboarding/initiate",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.exits, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateClearanceItem = createAsyncThunk(
  "offboarding/updateClearanceItem",
  async ({ id, section, data }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.exits}/${id}/clearance/${section}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const saveExitInterview = createAsyncThunk(
  "offboarding/saveExitInterview",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.exits}/${id}/exit-interview`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchSettlementPreview = createAsyncThunk(
  "offboarding/fetchSettlementPreview",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.exits}/${id}/settlement`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const processSettlement = createAsyncThunk(
  "offboarding/processSettlement",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.exits}/${id}/process-settlement`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const cancelExit = createAsyncThunk(
  "offboarding/cancel",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.exits}/${id}/cancel`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertExit = (state, exit) => {
  if (!exit) return;
  const idx = state.exits.findIndex((e) => e.id === exit.id);
  if (idx !== -1) state.exits[idx] = exit;
  else state.exits.unshift(exit);
  if (state.currentExit?.id === exit.id) state.currentExit = exit;
};

const offboardingSlice = createSlice({
  name: "offboarding",
  initialState,
  reducers: {
    clearCurrentExit: (state) => { state.currentExit = null; state.settlementPreview = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExits.pending, (state) => { state.exitsLoading = true; })
      .addCase(fetchExits.fulfilled, (state, action) => {
        state.exitsLoading = false;
        state.exits = action.payload.result || [];
        state.exitsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchExits.rejected, (state) => {
        state.exitsLoading = false;
        state.exits = [];
        state.exitsTotal = 0;
      })
      .addCase(fetchExitsSummary.fulfilled, (state, action) => {
        if (action.payload) state.exitsSummary = action.payload;
      })
      .addCase(fetchExitById.pending, (state) => { state.currentExitLoading = true; })
      .addCase(fetchExitById.fulfilled, (state, action) => { state.currentExitLoading = false; state.currentExit = action.payload; })
      .addCase(fetchExitById.rejected, (state) => { state.currentExitLoading = false; })
      .addCase(initiateExit.fulfilled, (state, action) => upsertExit(state, action.payload))
      .addCase(fetchSettlementPreview.fulfilled, (state, action) => { state.settlementPreview = action.payload; })
      .addMatcher(
        (action) =>
          [
            updateClearanceItem.fulfilled.type,
            saveExitInterview.fulfilled.type,
            processSettlement.fulfilled.type,
            cancelExit.fulfilled.type,
          ].includes(action.type),
        (state, action) => upsertExit(state, action.payload),
      );
  },
});

export const { clearCurrentExit } = offboardingSlice.actions;

export const showExits = (state) => state.offboarding.exits;
export const showExitsTotal = (state) => state.offboarding.exitsTotal;
export const showExitsLoading = (state) => state.offboarding.exitsLoading;
export const showExitsSummary = (state) => state.offboarding.exitsSummary;
export const showCurrentExit = (state) => state.offboarding.currentExit;
export const showCurrentExitLoading = (state) => state.offboarding.currentExitLoading;
export const showSettlementPreview = (state) => state.offboarding.settlementPreview;

export default offboardingSlice.reducer;
