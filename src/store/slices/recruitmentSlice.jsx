import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  jobs: [],
  jobsTotal: 0,
  jobsLoading: false,
  jobsSummary: { totalJobs: 0, openJobs: 0, inProcessCandidates: 0, hiredCandidates: 0 },
  currentJob: null,

  candidates: [],
  candidatesLoading: false,
  candidatesByJob: {},
};

// ── Jobs ───────────────────────────────────────

export const fetchJobs = createAsyncThunk(
  "recruitment/fetchJobs",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.jobs}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchJobsSummary = createAsyncThunk(
  "recruitment/fetchJobsSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.jobs}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchJobById = createAsyncThunk(
  "recruitment/fetchJobById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.jobs}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createJob = createAsyncThunk(
  "recruitment/createJob",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.jobs, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateJob = createAsyncThunk(
  "recruitment/updateJob",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.jobs}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ── Candidates ─────────────────────────────────

export const fetchCandidates = createAsyncThunk(
  "recruitment/fetchCandidates",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.candidates}?${query}`);
    if (isEmptyListResponse(response)) return { result: [] };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchCandidatesByJob = createAsyncThunk(
  "recruitment/fetchCandidatesByJob",
  async (jobId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.candidates}/job/${jobId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return { jobId, result: response.result };
  },
);

export const applyCandidate = createAsyncThunk(
  "recruitment/applyCandidate",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.candidates, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateCandidateStage = createAsyncThunk(
  "recruitment/updateCandidateStage",
  async ({ id, stage }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.candidates}/${id}/stage`, { stage });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const hireCandidate = createAsyncThunk(
  "recruitment/hireCandidate",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.candidates}/${id}/hire`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertJob = (state, job) => {
  if (!job) return;
  const idx = state.jobs.findIndex((j) => j.id === job.id);
  if (idx !== -1) state.jobs[idx] = job;
  else state.jobs.unshift(job);
  if (state.currentJob?.id === job.id) state.currentJob = job;
};

const upsertCandidate = (state, candidate) => {
  if (!candidate) return;
  const idx = state.candidates.findIndex((c) => c.id === candidate.id);
  if (idx !== -1) state.candidates[idx] = candidate;
  Object.keys(state.candidatesByJob).forEach((jobId) => {
    const list = state.candidatesByJob[jobId];
    const i = list.findIndex((c) => c.id === candidate.id);
    if (i !== -1) list[i] = candidate;
  });
};

const recruitmentSlice = createSlice({
  name: "recruitment",
  initialState,
  reducers: {
    clearCurrentJob: (state) => { state.currentJob = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.jobsLoading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.jobsLoading = false;
        state.jobs = action.payload.result || [];
        state.jobsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchJobs.rejected, (state) => {
        state.jobsLoading = false;
        state.jobs = [];
        state.jobsTotal = 0;
      })
      .addCase(fetchJobsSummary.fulfilled, (state, action) => {
        if (action.payload) state.jobsSummary = action.payload;
      })
      .addCase(fetchJobById.pending, (state) => { state.currentJobLoading = true; })
      .addCase(fetchJobById.fulfilled, (state, action) => { state.currentJobLoading = false; state.currentJob = action.payload; })
      .addCase(fetchJobById.rejected, (state) => { state.currentJobLoading = false; })
      .addCase(createJob.fulfilled, (state, action) => upsertJob(state, action.payload))
      .addCase(updateJob.fulfilled, (state, action) => upsertJob(state, action.payload))
      .addCase(fetchCandidates.pending, (state) => { state.candidatesLoading = true; })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.candidatesLoading = false;
        state.candidates = action.payload.result || [];
      })
      .addCase(fetchCandidates.rejected, (state) => {
        state.candidatesLoading = false;
        state.candidates = [];
      })
      .addCase(fetchCandidatesByJob.fulfilled, (state, action) => {
        state.candidatesByJob[action.payload.jobId] = action.payload.result || [];
      })
      .addCase(applyCandidate.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.candidates.unshift(action.payload);
        const jobId = action.payload.jobId;
        if (state.candidatesByJob[jobId]) state.candidatesByJob[jobId].unshift(action.payload);
      })
      .addCase(updateCandidateStage.fulfilled, (state, action) => upsertCandidate(state, action.payload))
      .addCase(hireCandidate.fulfilled, (state, action) => upsertCandidate(state, action.payload?.candidate));
  },
});

export const { clearCurrentJob } = recruitmentSlice.actions;

export const showJobs = (state) => state.recruitment.jobs;
export const showJobsTotal = (state) => state.recruitment.jobsTotal;
export const showJobsLoading = (state) => state.recruitment.jobsLoading;
export const showJobsSummary = (state) => state.recruitment.jobsSummary;
export const showCurrentJob = (state) => state.recruitment.currentJob;
export const showCurrentJobLoading = (state) => state.recruitment.currentJobLoading;

export const showCandidates = (state) => state.recruitment.candidates;
export const showCandidatesByJob = (jobId) => (state) => state.recruitment.candidatesByJob[jobId] || [];

export default recruitmentSlice.reducer;
