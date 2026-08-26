// Client & Vendor module's Customer entity. NOT the same as the legacy
// `customerSlice`/`customerListSlice` (unrelated travel-agency feature) —
// deliberately named/keyed differently to avoid colliding with those.
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  currentLoading: false,
  tabLoading: false,
  error: null,

  invoices: [],
  invoicesTotal: 0,
  payments: [],
  paymentsTotal: 0,
  ledger: [],
  ledgerTotal: 0,
  ledgerOpeningBalance: 0,
  balance: null,
  debitCreditSummary: null,

  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
  dropdownLoading: false,
};

export const fetchSalesCustomers = createAsyncThunk(
  "salesCustomer/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.customers}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSalesCustomersDropdown = createAsyncThunk(
  "salesCustomer/fetchDropdown",
  async ({ page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.customers}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchSalesCustomerById = createAsyncThunk(
  "salesCustomer/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.customers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchCustomerInvoices = createAsyncThunk(
  "salesCustomer/fetchInvoices",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.customers}/${id}/invoices?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchCustomerPayments = createAsyncThunk(
  "salesCustomer/fetchPayments",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.customers}/${id}/payments?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// Its own dedicated, paginated endpoint — the ledger is computed and
// paginated entirely server-side (running balance requires the full
// chronological history, not just the page being displayed), not derived
// client-side off the Invoices tab's own state.
export const fetchCustomerLedger = createAsyncThunk(
  "salesCustomer/fetchLedger",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.customers}/${id}/ledger?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// The Debit/Credit Balance tab's own dedicated endpoint — returns just
// {openingBalance, totalPaid, balanceDue}, not the full invoices list.
export const fetchCustomerDebitCreditSummary = createAsyncThunk(
  "salesCustomer/fetchDebitCreditSummary",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.customers}/${id}/debit-credit-balance`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchCustomerBalance = createAsyncThunk(
  "salesCustomer/fetchBalance",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.customers}/${id}/balance`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result?.balance ?? null;
  },
);

// Fulfilled payload carries the API's own `message` alongside the result —
// callers show that message (toast.success(created.message)) instead of a
// separately hardcoded frontend string, so what the user sees always
// reflects what the backend actually said.
export const createSalesCustomer = createAsyncThunk(
  "salesCustomer/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.customers, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, message: response.message };
  },
);

export const updateSalesCustomer = createAsyncThunk(
  "salesCustomer/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.customers}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, message: response.message };
  },
);

export const deleteSalesCustomer = createAsyncThunk(
  "salesCustomer/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.customers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return { id, message: response.message };
  },
);

const salesCustomerSlice = createSlice({
  name: "salesCustomer",
  initialState,
  reducers: {
    clearCurrentSalesCustomer: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchSalesCustomers.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchSalesCustomerById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchSalesCustomerById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchSalesCustomerById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload.result || [];
        state.invoicesTotal = action.payload.total_records || 0;
      })
      .addCase(fetchCustomerPayments.fulfilled, (state, action) => {
        state.payments = action.payload.result || [];
        state.paymentsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchCustomerLedger.fulfilled, (state, action) => {
        state.ledger = action.payload.result || [];
        state.ledgerTotal = action.payload.total_records || 0;
        state.ledgerOpeningBalance = action.payload.opening_balance || 0;
      })
      .addCase(fetchCustomerBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      .addCase(fetchCustomerDebitCreditSummary.fulfilled, (state, action) => {
        state.debitCreditSummary = action.payload;
      })
      .addCase(fetchSalesCustomersDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchSalesCustomersDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchSalesCustomersDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createSalesCustomer.fulfilled, (state, action) => {
        if (action.payload?.result) state.list.unshift(action.payload.result);
      })
      .addCase(updateSalesCustomer.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload?.result?.id);
        if (idx !== -1) state.list[idx] = action.payload.result;
        state.current = action.payload.result;
      })
      .addCase(deleteSalesCustomer.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload?.id);
      })
      .addMatcher(
        (action) =>
          [
            fetchCustomerInvoices.pending.type,
            fetchCustomerPayments.pending.type,
            fetchCustomerLedger.pending.type,
            fetchCustomerBalance.pending.type,
            fetchCustomerDebitCreditSummary.pending.type,
          ].includes(action.type),
        (state) => { state.tabLoading = true; },
      )
      .addMatcher(
        (action) =>
          [
            fetchCustomerInvoices.fulfilled.type,
            fetchCustomerInvoices.rejected.type,
            fetchCustomerPayments.fulfilled.type,
            fetchCustomerPayments.rejected.type,
            fetchCustomerLedger.fulfilled.type,
            fetchCustomerLedger.rejected.type,
            fetchCustomerBalance.fulfilled.type,
            fetchCustomerBalance.rejected.type,
            fetchCustomerDebitCreditSummary.fulfilled.type,
            fetchCustomerDebitCreditSummary.rejected.type,
          ].includes(action.type),
        (state) => { state.tabLoading = false; },
      );
  },
});

export const { clearCurrentSalesCustomer } = salesCustomerSlice.actions;
export const showSalesCustomers = (state) => state.salesCustomer.list;
export const showSalesCustomersTotal = (state) => state.salesCustomer.totalRecords;
export const showSalesCustomersLoading = (state) => state.salesCustomer.loading;
export const showCurrentSalesCustomer = (state) => state.salesCustomer.current;
export const showCurrentSalesCustomerLoading = (state) => state.salesCustomer.currentLoading;
export const showSalesCustomerTabLoading = (state) => state.salesCustomer.tabLoading;
export const showCustomerInvoices = (state) => state.salesCustomer.invoices;
export const showCustomerInvoicesTotal = (state) => state.salesCustomer.invoicesTotal;
export const showCustomerPayments = (state) => state.salesCustomer.payments;
export const showCustomerPaymentsTotal = (state) => state.salesCustomer.paymentsTotal;
export const showCustomerLedger = (state) => state.salesCustomer.ledger;
export const showCustomerLedgerTotal = (state) => state.salesCustomer.ledgerTotal;
export const showCustomerLedgerOpeningBalance = (state) => state.salesCustomer.ledgerOpeningBalance;
export const showCustomerBalance = (state) => state.salesCustomer.balance;
export const showCustomerDebitCreditSummary = (state) => state.salesCustomer.debitCreditSummary;
export const showSalesCustomerDropdownOptions = (state) => state.salesCustomer.dropdownOptions;
export const showSalesCustomerDropdownPage = (state) => state.salesCustomer.dropdownPage;
export const showSalesCustomerDropdownHasMore = (state) => state.salesCustomer.dropdownHasMore;
export const showSalesCustomerDropdownLoading = (state) => state.salesCustomer.dropdownLoading;
export default salesCustomerSlice.reducer;
