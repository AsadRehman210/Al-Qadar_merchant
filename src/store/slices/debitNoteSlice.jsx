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
  returnableLoading: false,
};

export const fetchDebitNotes = createAsyncThunk(
  "debitNote/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 10, ...params });
    const response = await erpGet(`${erpUrls.debitNotes}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchDebitNoteById = createAsyncThunk(
  "debitNote/fetchById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.debitNotes}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createDebitNote = createAsyncThunk(
  "debitNote/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.debitNotes, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// The Add Debit Note form's line items are never a free product pick — they
// can only ever be "some or all of what this invoice actually billed", so
// the form drives its whole line list off this instead of a catalog search.
export const fetchReturnableLines = createAsyncThunk(
  "debitNote/fetchReturnableLines",
  async (invoiceId, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.debitNotes}/returnable/${invoiceId}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateDebitNoteStatus = createAsyncThunk(
  "debitNote/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.debitNotes}/${id}/status`, { status });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const upsertList = (state, dn) => {
  if (!dn) return;
  const idx = state.list.findIndex((d) => d.id === dn.id);
  if (idx !== -1) state.list[idx] = dn;
  if (state.current?.id === dn.id) state.current = dn;
};

const debitNoteSlice = createSlice({
  name: "debitNote",
  initialState,
  reducers: {
    clearCurrentDebitNote: (state) => {
      state.current = null;
    },
    clearReturnableLines: (state) => {
      state.returnableInvoice = null;
      state.returnableLines = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnableLines.pending, (state) => {
        state.returnableLoading = true;
      })
      .addCase(fetchReturnableLines.fulfilled, (state, action) => {
        state.returnableLoading = false;
        state.returnableInvoice = action.payload?.invoice || null;
        state.returnableLines = action.payload?.lines || [];
      })
      .addCase(fetchReturnableLines.rejected, (state) => {
        state.returnableLoading = false;
        state.returnableInvoice = null;
        state.returnableLines = [];
      })
      .addCase(fetchDebitNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDebitNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchDebitNotes.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchDebitNoteById.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchDebitNoteById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchDebitNoteById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createDebitNote.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(updateDebitNoteStatus.fulfilled, (state, action) => upsertList(state, action.payload));
  },
});

export const { clearCurrentDebitNote, clearReturnableLines } = debitNoteSlice.actions;
export const showDebitNotes = (state) => state.debitNote.list;
export const showDebitNotesTotal = (state) => state.debitNote.totalRecords;
export const showDebitNotesLoading = (state) => state.debitNote.loading;
export const showCurrentDebitNote = (state) => state.debitNote.current;
export const showCurrentDebitNoteLoading = (state) => state.debitNote.currentLoading;
export const showReturnableInvoice = (state) => state.debitNote.returnableInvoice;
export const showReturnableLines = (state) => state.debitNote.returnableLines;
export const showReturnableLoading = (state) => state.debitNote.returnableLoading;
export default debitNoteSlice.reducer;
