import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  templates: [],
  templatesLoading: false,

  onboardings: [],
  onboardingsTotal: 0,
  onboardingsLoading: false,
  onboardingsSummary: { total: 0, inProgress: 0, completed: 0 },
  onboardingByEmployee: {},
};

// ── Task templates ─────────────────────────────

export const fetchOnboardingTemplates = createAsyncThunk(
  "onboarding/fetchTemplates",
  async (_params, { rejectWithValue }) => {
    const response = await erpGet(erpUrls.onboardingTemplates);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createOnboardingTemplate = createAsyncThunk(
  "onboarding/createTemplate",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.onboardingTemplates, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateOnboardingTemplate = createAsyncThunk(
  "onboarding/updateTemplate",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.onboardingTemplates}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteOnboardingTemplate = createAsyncThunk(
  "onboarding/deleteTemplate",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.onboardingTemplates}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

export const reorderOnboardingTemplates = createAsyncThunk(
  "onboarding/reorderTemplates",
  async (orderedIds, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.onboardingTemplates}/reorder`, { orderedIds });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ── Onboarding records ─────────────────────────

export const fetchOnboardings = createAsyncThunk(
  "onboarding/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.onboardings}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchOnboardingsSummary = createAsyncThunk(
  "onboarding/fetchSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.onboardings}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchOnboardingByEmployee = createAsyncThunk(
  "onboarding/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.onboardings}/employee/${employeeId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return { employeeId, result: response.result };
  },
);

export const toggleOnboardingTask = createAsyncThunk(
  "onboarding/toggleTask",
  async ({ id, templateId }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.onboardings}/${id}/task/${templateId}`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOnboardingTemplates.pending, (state) => { state.templatesLoading = true; })
      .addCase(fetchOnboardingTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload || [];
      })
      .addCase(fetchOnboardingTemplates.rejected, (state) => {
        state.templatesLoading = false;
        state.templates = [];
      })
      .addCase(createOnboardingTemplate.fulfilled, (state, action) => {
        if (action.payload) state.templates.push(action.payload);
      })
      .addCase(updateOnboardingTemplate.fulfilled, (state, action) => {
        const idx = state.templates.findIndex((t) => t.id === action.payload?.id);
        if (idx !== -1) state.templates[idx] = action.payload;
      })
      .addCase(deleteOnboardingTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
      })
      .addCase(reorderOnboardingTemplates.fulfilled, (state, action) => {
        state.templates = action.payload || state.templates;
      })
      .addCase(fetchOnboardings.pending, (state) => { state.onboardingsLoading = true; })
      .addCase(fetchOnboardings.fulfilled, (state, action) => {
        state.onboardingsLoading = false;
        state.onboardings = action.payload.result || [];
        state.onboardingsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchOnboardings.rejected, (state) => {
        state.onboardingsLoading = false;
        state.onboardings = [];
        state.onboardingsTotal = 0;
      })
      .addCase(fetchOnboardingsSummary.fulfilled, (state, action) => {
        if (action.payload) state.onboardingsSummary = action.payload;
      })
      .addCase(fetchOnboardingByEmployee.fulfilled, (state, action) => {
        state.onboardingByEmployee[action.payload.employeeId] = action.payload.result;
      })
      .addCase(toggleOnboardingTask.fulfilled, (state, action) => {
        if (!action.payload) return;
        const idx = state.onboardings.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.onboardings[idx] = action.payload;
      });
  },
});

export const showOnboardingTemplates = (state) => state.onboarding.templates;
export const showOnboardingTemplatesLoading = (state) => state.onboarding.templatesLoading;
export const showOnboardings = (state) => state.onboarding.onboardings;
export const showOnboardingsTotal = (state) => state.onboarding.onboardingsTotal;
export const showOnboardingsLoading = (state) => state.onboarding.onboardingsLoading;
export const showOnboardingsSummary = (state) => state.onboarding.onboardingsSummary;
export const showOnboardingByEmployee = (employeeId) => (state) => state.onboarding.onboardingByEmployee[employeeId] || null;

export default onboardingSlice.reducer;
