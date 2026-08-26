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
  dropdownLoading: false,
  payables: [],
  payablesTotal: 0,
  payablesTotalBalanceDue: 0,
  payablesTotalRefundDue: 0,
  payablesLoading: false,
};

// Accounts Payable — real Purchase Invoices still owed to the supplier or
// owing a refund back, not a separate manually-entered record type.
export const fetchPayables = createAsyncThunk(
  "purchaseInvoice/fetchPayables",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 20, ...params });
    const response = await erpGet(`${erpUrls.purchaseInvoices}/payables?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchPurchaseInvoices = createAsyncThunk(
  "purchaseInvoice/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.purchaseInvoices}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchPurchaseInvoicesDropdown = createAsyncThunk(
  "purchaseInvoice/fetchDropdown",
  async ({ page = 1, search = "", supplierId } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search, supplierId });
    const response = await erpGet(`${erpUrls.purchaseInvoices}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

export const fetchPurchaseInvoiceById = createAsyncThunk(
  "purchaseInvoice/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.purchaseInvoices}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createPurchaseInvoice = createAsyncThunk(
  "purchaseInvoice/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.purchaseInvoices, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updatePurchaseInvoice = createAsyncThunk(
  "purchaseInvoice/update",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.purchaseInvoices}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updatePurchaseStatus = createAsyncThunk(
  "purchaseInvoice/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.purchaseInvoices}/${id}/status`, { status });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addPurchasePayment = createAsyncThunk(
  "purchaseInvoice/addPayment",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.purchaseInvoices}/${id}/payments`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const addPurchaseRefund = createAsyncThunk(
  "purchaseInvoice/addRefund",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.purchaseInvoices}/${id}/refunds`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deletePurchaseInvoice = createAsyncThunk(
  "purchaseInvoice/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.purchaseInvoices}/${id}`);
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

const purchaseInvoiceSlice = createSlice({
  name: "purchaseInvoice",
  initialState,
  reducers: {
    clearCurrentPurchaseInvoice: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayables.pending, (state) => {
        state.payablesLoading = true;
      })
      .addCase(fetchPayables.fulfilled, (state, action) => {
        state.payablesLoading = false;
        state.payables = action.payload?.result || [];
        state.payablesTotal = action.payload?.total_records || 0;
        state.payablesTotalBalanceDue = action.payload?.totalBalanceDue || 0;
        state.payablesTotalRefundDue = action.payload?.totalRefundDue || 0;
      })
      .addCase(fetchPayables.rejected, (state) => {
        state.payablesLoading = false;
        state.payables = [];
      })
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchPurchaseInvoiceById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchPurchaseInvoiceById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchPurchaseInvoiceById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(fetchPurchaseInvoicesDropdown.pending, (state) => {
        state.dropdownLoading = true;
      })
      .addCase(fetchPurchaseInvoicesDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { result, page, total_pages } = action.payload;
        state.dropdownOptions = page === 1 ? result : [...state.dropdownOptions, ...result];
        state.dropdownPage = page;
        state.dropdownHasMore = page < total_pages;
      })
      .addCase(fetchPurchaseInvoicesDropdown.rejected, (state) => {
        state.dropdownLoading = false;
      })
      .addCase(createPurchaseInvoice.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i.id !== action.payload);
      })
      .addMatcher(
        (action) =>
          [updatePurchaseInvoice.fulfilled.type, updatePurchaseStatus.fulfilled.type, addPurchasePayment.fulfilled.type, addPurchaseRefund.fulfilled.type].includes(
            action.type,
          ),
        (state, action) => upsertList(state, action.payload),
      );
  },
});

export const { clearCurrentPurchaseInvoice } = purchaseInvoiceSlice.actions;
export const showPurchaseInvoices = (state) => state.purchaseInvoice.list;
export const showPurchaseInvoicesTotal = (state) => state.purchaseInvoice.totalRecords;
export const showPurchaseInvoicesLoading = (state) => state.purchaseInvoice.loading;
export const showPayables = (state) => state.purchaseInvoice.payables;
export const showPayablesTotal = (state) => state.purchaseInvoice.payablesTotal;
export const showPayablesTotalBalanceDue = (state) => state.purchaseInvoice.payablesTotalBalanceDue;
export const showPayablesTotalRefundDue = (state) => state.purchaseInvoice.payablesTotalRefundDue;
export const showPayablesLoading = (state) => state.purchaseInvoice.payablesLoading;
export const showCurrentPurchaseInvoice = (state) => state.purchaseInvoice.current;
export const showCurrentPurchaseInvoiceLoading = (state) => state.purchaseInvoice.currentLoading;
export const showPurchaseInvoiceDropdownOptions = (state) => state.purchaseInvoice.dropdownOptions;
export const showPurchaseInvoiceDropdownPage = (state) => state.purchaseInvoice.dropdownPage;
export const showPurchaseInvoiceDropdownHasMore = (state) => state.purchaseInvoice.dropdownHasMore;
export const showPurchaseInvoiceDropdownLoading = (state) => state.purchaseInvoice.dropdownLoading;
export default purchaseInvoiceSlice.reducer;
