import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  // UI-state (list page filters), unchanged from before this module was wired
  search: "",
  filterStatus: null,
  currentPage: 1,
  lastUpdated: null,

  policy: null,
  policyLoading: false,

  // Real server-side paginated list of PF accounts (only employees who
  // already have an account — matches the backend's getAllAccounts list).
  list: [],
  totalRecords: 0,
  listLoading: false,

  // Tenant-wide totals for the stat cards — independent of pagination/search.
  summary: { totalFund: 0, totalEmployeeContrib: 0, totalEmployerContrib: 0, totalWithdrawn: 0 },

  // Keyed by employeeId — used by the per-employee detail page.
  accountsByEmployee: {},

  currentAccount: null,
  contributionHistory: [],
  withdrawalsByEmployee: [],
  currentWithdrawal: null,

  loading: false,
  error: null,
};

export const fetchPfPolicy = createAsyncThunk(
  "providentFund/fetchPolicy",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(erpUrls.pfPolicy);
    if (response?.error_code === 404 && !response?.success) return null;
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const upsertPfPolicy = createAsyncThunk(
  "providentFund/upsertPolicy",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.pfPolicy, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchPfAccountByEmployee = createAsyncThunk(
  "providentFund/fetchAccountByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.pfAccount}/employee/${employeeId}`);
    if (response?.error_code === 404 && !response?.success) return { employeeId, account: null };
    if (!response?.success) return rejectWithValue(response?.message);
    return { employeeId, account: response.result };
  },
);

// Real server-side paginated fetch of the tenant's PF accounts list.
export const fetchAllPfAccounts = createAsyncThunk(
  "providentFund/fetchAllAccounts",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.pfAccount}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchPfAccountsSummary = createAsyncThunk(
  "providentFund/fetchAccountsSummary",
  async (_arg, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.pfAccount}/summary`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const postPfContribution = createAsyncThunk(
  "providentFund/postContribution",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.pfContribution, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchPfContributionHistory = createAsyncThunk(
  "providentFund/fetchContributionHistory",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.pfContribution}/employee/${employeeId}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const applyPfWithdrawal = createAsyncThunk(
  "providentFund/applyWithdrawal",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.pfWithdrawal, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchPfWithdrawalsByEmployee = createAsyncThunk(
  "providentFund/fetchWithdrawalsByEmployee",
  async (employeeId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.pfWithdrawal}/employee/${employeeId}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const approvePfWithdrawal = createAsyncThunk(
  "providentFund/approveWithdrawal",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.pfWithdrawal}/${id}/approve`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const rejectPfWithdrawal = createAsyncThunk(
  "providentFund/rejectWithdrawal",
  async ({ id, remarks }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.pfWithdrawal}/${id}/reject`, { remarks });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const markPfWithdrawalPaid = createAsyncThunk(
  "providentFund/markWithdrawalPaid",
  async (id, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.pfWithdrawal}/${id}/mark-paid`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertWithdrawalInList = (list, updated) => {
  if (!updated) return list;
  const idx = list.findIndex((w) => w.id === updated.id);
  if (idx === -1) return [updated, ...list];
  const next = [...list];
  next[idx] = updated;
  return next;
};

const providentFundSlice = createSlice({
  name: "providentFund",
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    setFilterStatus: (state, action) => { state.filterStatus = action.payload; },
    setCurrentPage: (state, action) => { state.currentPage = action.payload; },
    triggerRefresh: (state) => { state.lastUpdated = Date.now(); },
    clearPfDetail: (state) => {
      state.currentAccount = null;
      state.contributionHistory = [];
      state.withdrawalsByEmployee = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPfPolicy.pending, (state) => { state.policyLoading = true; })
      .addCase(fetchPfPolicy.fulfilled, (state, action) => {
        state.policyLoading = false;
        state.policy = action.payload;
      })
      .addCase(fetchPfPolicy.rejected, (state) => { state.policyLoading = false; })
      .addCase(upsertPfPolicy.fulfilled, (state, action) => { state.policy = action.payload; })

      .addCase(fetchPfAccountByEmployee.fulfilled, (state, action) => {
        const { employeeId, account } = action.payload;
        state.accountsByEmployee[employeeId] = account;
        if (state.currentAccount === null || state.currentAccount?.employeeId === employeeId) {
          state.currentAccount = account;
        }
      })

      .addCase(fetchAllPfAccounts.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchAllPfAccounts.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAllPfAccounts.rejected, (state) => {
        state.listLoading = false;
        state.list = [];
      })

      .addCase(fetchPfAccountsSummary.fulfilled, (state, action) => {
        if (action.payload) state.summary = action.payload;
      })

      .addCase(postPfContribution.fulfilled, (state, action) => {
        if (action.payload) state.contributionHistory.unshift(action.payload);
      })
      .addCase(fetchPfContributionHistory.fulfilled, (state, action) => {
        state.contributionHistory = action.payload;
      })

      .addCase(applyPfWithdrawal.fulfilled, (state, action) => {
        if (action.payload) state.withdrawalsByEmployee.unshift(action.payload);
      })
      .addCase(fetchPfWithdrawalsByEmployee.fulfilled, (state, action) => {
        state.withdrawalsByEmployee = action.payload;
      })
      .addCase(approvePfWithdrawal.fulfilled, (state, action) => {
        state.withdrawalsByEmployee = upsertWithdrawalInList(state.withdrawalsByEmployee, action.payload);
      })
      .addCase(rejectPfWithdrawal.fulfilled, (state, action) => {
        state.withdrawalsByEmployee = upsertWithdrawalInList(state.withdrawalsByEmployee, action.payload);
      })
      .addCase(markPfWithdrawalPaid.fulfilled, (state, action) => {
        state.withdrawalsByEmployee = upsertWithdrawalInList(state.withdrawalsByEmployee, action.payload);
        // A paid withdrawal reduces the account's currentBalance server-side —
        // reflect that locally too instead of requiring a full page refetch.
        if (action.payload?.employeeId) {
          const acct = state.accountsByEmployee[action.payload.employeeId];
          if (acct) {
            acct.currentBalance = round2((acct.currentBalance || 0) - (action.payload.amount || 0));
            acct.totalWithdrawn = round2((acct.totalWithdrawn || 0) + (action.payload.amount || 0));
          }
          if (state.currentAccount?.employeeId === action.payload.employeeId) {
            state.currentAccount = { ...acct };
          }
        }
      });
  },
});

const round2 = (value) => Math.round(value * 100) / 100;

export const {
  setSearch,
  setFilterStatus,
  setCurrentPage,
  triggerRefresh,
  clearPfDetail,
} = providentFundSlice.actions;

export const showPfPolicy = (state) => state.providentFund.policy;
export const showPfPolicyLoading = (state) => state.providentFund.policyLoading;
export const showPfAccountsByEmployee = (state) => state.providentFund.accountsByEmployee;
export const showPfAccountsList = (state) => state.providentFund.list;
export const showPfAccountsTotal = (state) => state.providentFund.totalRecords;
export const showPfAccountsLoading = (state) => state.providentFund.listLoading;
export const showPfCurrentAccount = (state) => state.providentFund.currentAccount;
export const showPfAccountsSummary = (state) => state.providentFund.summary;
export const showPfContributionHistory = (state) => state.providentFund.contributionHistory;
export const showPfWithdrawalsByEmployee = (state) => state.providentFund.withdrawalsByEmployee;

export default providentFundSlice.reducer;
