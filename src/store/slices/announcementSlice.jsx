import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpDelete, isEmptyListResponse , buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  loading: false,
  error: null,
};

export const fetchAnnouncements = createAsyncThunk(
  "announcement/fetchAll",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.announcements}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createAnnouncement = createAsyncThunk(
  "announcement/create",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.announcements, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteAnnouncement = createAsyncThunk(
  "announcement/delete",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.announcements}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

const announcementSlice = createSlice({
  name: "announcement",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        if (action.payload) state.list.unshift(action.payload);
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload);
      });
  },
});

export const showAnnouncements = (state) => state.announcement.list;
export const showAnnouncementsTotal = (state) => state.announcement.totalRecords;
export const showAnnouncementsLoading = (state) => state.announcement.loading;
export default announcementSlice.reducer;
