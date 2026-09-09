import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpPatch, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";
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
  receivables: [],
  receivablesTotal: 0,
  receivablesTotalBalanceDue: 0,
  receivablesTotalRefundDue: 0,
  collectedTax: [],
  collectedTaxTotal: 0,
  collectedTaxTotalAmount: 0,
};

// Accounts Receivable — real Sale Invoices still owed on or owing a refund
// back, not a separate manually-entered record type.
export const fetchReceivables = createAsyncThunk(
  "saleInvoice/fetchReceivables",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 20, ...params });
    const response = await erpGet(`${erpUrls.saleInvoices}/receivables?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// "Collected Tax" module — every Sale Invoice's output tax, with the true
// total across every matching invoice.
export const fetchCollectedTaxReport = createAsyncThunk(
  "saleInvoice/fetchCollectedTaxReport",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.saleInvoices}/collected-tax-report?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchSaleInvoices = createAsyncThunk(
  "saleInvoice/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.saleInvoices}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchSaleInvoicesDropdown = createAsyncThunk(
  "saleInvoice/fetchDropdown",
  async ({ page = 1, search = "", customerId } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, customerId });
    const response = await erpGet(`${erpUrls.saleInvoices}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchSaleInvoiceById = createAsyncThunk(
  "saleInvoice/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.saleInvoices}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createSaleInvoice = createAsyncThunk(
  "saleInvoice/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.saleInvoices, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateSaleInvoice = createAsyncThunk(
  "saleInvoice/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.saleInvoices}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateSaleDeliveryStatus = createAsyncThunk(
  "saleInvoice/updateDeliveryStatus",
  async ({ id, status }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.saleInvoices}/${id}/delivery-status`, { status });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addSalePayment = createAsyncThunk(
  "saleInvoice/addPayment",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.saleInvoices}/${id}/payments`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addSaleRefund = createAsyncThunk(
  "saleInvoice/addRefund",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.saleInvoices}/${id}/refunds`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteSaleInvoice = createAsyncThunk(
  "saleInvoice/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.saleInvoices}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const upsertList = (state, invoice) => {
  if (!invoice) return;
  const idx = state.list.findIndex((i) => i.id === invoice.id);
  if (idx !== -1) state.list[idx] = invoice;
  if (state.current?.id === invoice.id) state.current = invoice;
};

const saleInvoiceSlice = createSlice({
  name: "saleInvoice",
  initialState,
  reducers: {
    clearCurrentSaleInvoice: (state) => {
      state.current = null;
      state.loading = false;
    },
    clearSaleInvoicesList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
      state.receivables = [];
      state.receivablesTotal = 0;
      state.receivablesTotalBalanceDue = 0;
      state.receivablesTotalRefundDue = 0;
      state.collectedTax = [];
      state.collectedTaxTotal = 0;
      state.collectedTaxTotalAmount = 0;
    },
    resetSaleInvoiceDropdown: (state) => {
      state.dropdownOptions = [];
      state.dropdownPage = 1;
      state.dropdownHasMore = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceivables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReceivables.fulfilled, (state, action) => {
        state.loading = false;
        state.receivables = action.payload?.result || [];
        state.receivablesTotal = action.payload?.total_records || 0;
        state.receivablesTotalBalanceDue = action.payload?.totalBalanceDue || 0;
        state.receivablesTotalRefundDue = action.payload?.totalRefundDue || 0;
      })
      .addCase(fetchReceivables.rejected, (state) => {
        state.loading = false;
        state.receivables = [];
      })
      .addCase(fetchCollectedTaxReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCollectedTaxReport.fulfilled, (state, action) => {
        state.loading = false;
        state.collectedTax = action.payload?.result || [];
        state.collectedTaxTotal = action.payload?.total_records || 0;
        state.collectedTaxTotalAmount = action.payload?.totalTaxAmount || 0;
      })
      .addCase(fetchCollectedTaxReport.rejected, (state) => {
        state.loading = false;
        state.collectedTax = [];
      })
      .addCase(fetchSaleInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchSaleInvoices.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchSaleInvoiceById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSaleInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchSaleInvoiceById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchSaleInvoicesDropdown.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSaleInvoicesDropdown.fulfilled, (state, action) => {
        state.loading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchSaleInvoicesDropdown.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createSaleInvoice.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(deleteSaleInvoice.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i.id !== action.payload);
      })
      .addMatcher(
        (action) =>
          [updateSaleInvoice.fulfilled.type, updateSaleDeliveryStatus.fulfilled.type, addSalePayment.fulfilled.type, addSaleRefund.fulfilled.type].includes(
            action.type,
          ),
        (state, action) => upsertList(state, action.payload),
      );
  },
});

export const { clearCurrentSaleInvoice, clearSaleInvoicesList, resetSaleInvoiceDropdown } = saleInvoiceSlice.actions;
export const showSaleInvoices = (state) => state.saleInvoice.list;
export const showSaleInvoicesTotal = (state) => state.saleInvoice.totalRecords;
export const showSaleInvoicesLoading = (state) => state.saleInvoice.loading;
export const showReceivables = (state) => state.saleInvoice.receivables;
export const showReceivablesTotal = (state) => state.saleInvoice.receivablesTotal;
export const showReceivablesTotalBalanceDue = (state) => state.saleInvoice.receivablesTotalBalanceDue;
export const showReceivablesTotalRefundDue = (state) => state.saleInvoice.receivablesTotalRefundDue;
export const showReceivablesLoading = (state) => state.saleInvoice.loading;
export const showCollectedTax = (state) => state.saleInvoice.collectedTax;
export const showCollectedTaxTotal = (state) => state.saleInvoice.collectedTaxTotal;
export const showCollectedTaxTotalAmount = (state) => state.saleInvoice.collectedTaxTotalAmount;
export const showCollectedTaxLoading = (state) => state.saleInvoice.loading;
export const showCurrentSaleInvoice = (state) => state.saleInvoice.current;
export const showCurrentSaleInvoiceLoading = (state) => state.saleInvoice.loading;
export const showSaleInvoiceDropdownOptions = (state) => state.saleInvoice.dropdownOptions;
export const showSaleInvoiceDropdownPage = (state) => state.saleInvoice.dropdownPage;
export const showSaleInvoiceDropdownHasMore = (state) => state.saleInvoice.dropdownHasMore;
export const showSaleInvoiceDropdownLoading = (state) => state.saleInvoice.loading;
export default saleInvoiceSlice.reducer;
