import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPatch, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  loading: false,
  error: null,
  returnableInvoice: null,
  returnableLines: [],
};

export const fetchCreditNotes = createAsyncThunk(
  "creditNote/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.creditNotes}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchCreditNoteById = createAsyncThunk(
  "creditNote/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.creditNotes}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createCreditNote = createAsyncThunk(
  "creditNote/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.creditNotes, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// The Add Credit Note form's line items are never a free product pick — they
// can only ever be "some or all of what this invoice actually sold", so the
// form drives its whole line list off this instead of a catalog search.
export const fetchReturnableLines = createAsyncThunk(
  "creditNote/fetchReturnableLines",
  async (invoiceId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.creditNotes}/returnable/${invoiceId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateCreditNoteStatus = createAsyncThunk(
  "creditNote/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.creditNotes}/${id}/status`, { status });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertList = (state, cn) => {
  if (!cn) return;
  const idx = state.list.findIndex((c) => c.id === cn.id);
  if (idx !== -1) state.list[idx] = cn;
  if (state.current?.id === cn.id) state.current = cn;
};

const creditNoteSlice = createSlice({
  name: "creditNote",
  initialState,
  reducers: {
    clearCurrentCreditNote: (state) => {
      state.current = null;
      state.loading = false;
      state.returnableInvoice = null;
      state.returnableLines = [];
    },
    clearCreditNotesList: (state) => {
      state.list = [];
      state.totalRecords = 0;
      state.loading = false;
      state.error = null;
    },
    clearReturnableLines: (state) => {
      state.returnableInvoice = null;
      state.returnableLines = [];
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnableLines.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReturnableLines.fulfilled, (state, action) => {
        state.loading = false;
        state.returnableInvoice = action.payload?.invoice || null;
        state.returnableLines = action.payload?.lines || [];
      })
      .addCase(fetchReturnableLines.rejected, (state) => {
        state.loading = false;
        state.returnableInvoice = null;
        state.returnableLines = [];
      })
      .addCase(fetchCreditNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchCreditNotes.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchCreditNoteById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCreditNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCreditNoteById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createCreditNote.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateCreditNoteStatus.fulfilled, (state, action) => upsertList(state, action.payload));
  },
});

export const { clearCurrentCreditNote, clearCreditNotesList, clearReturnableLines } = creditNoteSlice.actions;
export const showCreditNotes = (state) => state.creditNote.list;
export const showCreditNotesTotal = (state) => state.creditNote.totalRecords;
export const showCreditNotesLoading = (state) => state.creditNote.loading;
export const showCurrentCreditNote = (state) => state.creditNote.current;
export const showCurrentCreditNoteLoading = (state) => state.creditNote.loading;
export const showReturnableInvoice = (state) => state.creditNote.returnableInvoice;
export const showReturnableLines = (state) => state.creditNote.returnableLines;
export const showReturnableLoading = (state) => state.creditNote.loading;
export default creditNoteSlice.reducer;
