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

  invoices: [],
  invoicesTotal: 0,
  payments: [],
  paymentsTotal: 0,
  balance: null,

  ledger: [],
  ledgerTotal: 0,
  ledgerOpeningBalance: 0,

  debitCreditSummary: null,

  dropdownOptions: [],
  dropdownPage: 1,
  dropdownHasMore: false,
};

export const fetchSuppliers = createAsyncThunk(
  "supplier/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.suppliers}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSuppliersDropdown = createAsyncThunk(
  "supplier/fetchDropdown",
  async ({ page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.suppliers}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchSupplierById = createAsyncThunk(
  "supplier/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.suppliers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchSupplierInvoices = createAsyncThunk(
  "supplier/fetchInvoices",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.suppliers}/${id}/invoices?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSupplierPayments = createAsyncThunk(
  "supplier/fetchPayments",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.suppliers}/${id}/payments?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

// Its own dedicated, paginated endpoint — the ledger is computed and
// paginated entirely server-side (running balance requires the full
// chronological history, not just the page being displayed), not derived
// client-side off the Supply Invoices tab's own state.
export const fetchSupplierLedger = createAsyncThunk(
  "supplier/fetchLedger",
  async ({ id, ...params }, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.suppliers}/${id}/ledger?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSupplierBalance = createAsyncThunk(
  "supplier/fetchBalance",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.suppliers}/${id}/balance`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result?.balance ?? null;
  },
);

// The Debit/Credit Balance tab's own dedicated endpoint — returns just
// {openingBalance, totalPaid, balanceDue}, not the full invoices list.
export const fetchSupplierDebitCreditSummary = createAsyncThunk(
  "supplier/fetchDebitCreditSummary",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.suppliers}/${id}/debit-credit-balance`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// Fulfilled payload carries the API's own `message` alongside the result —
// callers show that message (toast.success(created.message)) instead of a
// separately hardcoded frontend string, mirroring Customer's convention.
export const createSupplier = createAsyncThunk(
  "supplier/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.suppliers, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, message: response.message };
  },
);

export const updateSupplier = createAsyncThunk(
  "supplier/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.suppliers}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, message: response.message };
  },
);

export const deleteSupplier = createAsyncThunk(
  "supplier/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.suppliers}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return { id, message: response.message };
  },
);

export const addSupplierOpeningPayment = createAsyncThunk(
  "supplier/addOpeningPayment",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.suppliers}/${id}/opening-balance/payments`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, message: response.message };
  },
);

const supplierSlice = createSlice({
  name: "supplier",
  initialState,
  reducers: {
    clearCurrentSupplier: (state) => {
      state.current = null;
      state.loading = false;
      state.invoices = [];
      state.invoicesTotal = 0;
      state.payments = [];
      state.paymentsTotal = 0;
      state.ledger = [];
      state.ledgerTotal = 0;
      state.ledgerOpeningBalance = 0;
      state.balance = null;
      state.debitCreditSummary = null;
    },
    clearSuppliersList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
    },
    resetSupplierDropdown: (state) => {
      state.dropdownOptions = [];
      state.dropdownPage = 1;
      state.dropdownHasMore = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchSupplierById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchSupplierInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload.result || [];
        state.invoicesTotal = action.payload.total_records || 0;
      })
      .addCase(fetchSupplierPayments.fulfilled, (state, action) => {
        state.payments = action.payload.result || [];
        state.paymentsTotal = action.payload.total_records || 0;
      })
      .addCase(fetchSupplierLedger.fulfilled, (state, action) => {
        state.ledger = action.payload.result || [];
        state.ledgerTotal = action.payload.total_records || 0;
        state.ledgerOpeningBalance = action.payload.opening_balance || 0;
      })
      .addCase(fetchSupplierBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      .addCase(fetchSupplierDebitCreditSummary.fulfilled, (state, action) => {
        state.debitCreditSummary = action.payload;
      })
      .addCase(fetchSuppliersDropdown.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuppliersDropdown.fulfilled, (state, action) => {
        state.loading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchSuppliersDropdown.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        if (action.payload?.result) state.list.unshift(action.payload.result);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s.id === action.payload?.result?.id);
        if (idx !== -1) state.list[idx] = action.payload.result;
        state.current = action.payload.result;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload?.id);
      })
      .addCase(addSupplierOpeningPayment.fulfilled, (state, action) => {
        if (action.payload?.result) state.current = action.payload.result;
      })
      .addMatcher(
        (action) =>
          [
            fetchSupplierInvoices.pending.type,
            fetchSupplierPayments.pending.type,
            fetchSupplierLedger.pending.type,
            fetchSupplierBalance.pending.type,
            fetchSupplierDebitCreditSummary.pending.type,
          ].includes(action.type),
        (state) => { state.loading = true; },
      )
      .addMatcher(
        (action) =>
          [
            fetchSupplierInvoices.fulfilled.type,
            fetchSupplierInvoices.rejected.type,
            fetchSupplierPayments.fulfilled.type,
            fetchSupplierPayments.rejected.type,
            fetchSupplierLedger.fulfilled.type,
            fetchSupplierLedger.rejected.type,
            fetchSupplierBalance.fulfilled.type,
            fetchSupplierBalance.rejected.type,
            fetchSupplierDebitCreditSummary.fulfilled.type,
            fetchSupplierDebitCreditSummary.rejected.type,
          ].includes(action.type),
        (state) => { state.loading = false; },
      );
  },
});

export const { clearCurrentSupplier, clearSuppliersList, resetSupplierDropdown } = supplierSlice.actions;
export const showSuppliers = (state) => state.supplier.list;
export const showSuppliersTotal = (state) => state.supplier.totalRecords;
export const showSuppliersLoading = (state) => state.supplier.loading;
export const showCurrentSupplier = (state) => state.supplier.current;
export const showCurrentSupplierLoading = (state) => state.supplier.loading;
export const showSupplierTabLoading = (state) => state.supplier.loading;
export const showSupplierInvoices = (state) => state.supplier.invoices;
export const showSupplierInvoicesTotal = (state) => state.supplier.invoicesTotal;
export const showSupplierPayments = (state) => state.supplier.payments;
export const showSupplierPaymentsTotal = (state) => state.supplier.paymentsTotal;
export const showSupplierLedger = (state) => state.supplier.ledger;
export const showSupplierLedgerTotal = (state) => state.supplier.ledgerTotal;
export const showSupplierLedgerOpeningBalance = (state) => state.supplier.ledgerOpeningBalance;
export const showSupplierBalance = (state) => state.supplier.balance;
export const showSupplierDebitCreditSummary = (state) => state.supplier.debitCreditSummary;
export const showSupplierDropdownOptions = (state) => state.supplier.dropdownOptions;
export const showSupplierDropdownPage = (state) => state.supplier.dropdownPage;
export const showSupplierDropdownHasMore = (state) => state.supplier.dropdownHasMore;
export const showSupplierDropdownLoading = (state) => state.supplier.loading;
export default supplierSlice.reducer;
