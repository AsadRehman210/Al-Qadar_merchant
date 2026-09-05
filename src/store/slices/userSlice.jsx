import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpPatch, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  current: null,
  currentLoading: false,
  loading: false,
  saving: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("erpUser/fetchAll", async (params, { rejectWithValue }) => {
  const query = buildQuery({ page: 1, limit: 10, ...params });
  const response = await erpGet(`${erpUrls.users}?${query}`);
  if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
  if (!response?.success) return rejectWithValue(response?.message);
  return response;
});

export const fetchUserById = createAsyncThunk("erpUser/fetchById", async (id, { rejectWithValue }) => {
  const response = await erpGet(`${erpUrls.users}/${id}`);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const createUser = createAsyncThunk("erpUser/create", async (data, { rejectWithValue }) => {
  const response = await erpPost(erpUrls.users, data);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const updateUser = createAsyncThunk("erpUser/update", async ({ id, data }, { rejectWithValue }) => {
  const response = await erpPut(`${erpUrls.users}/${id}`, data);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const setUserStatus = createAsyncThunk(
  "erpUser/setStatus",
  async ({ id, active }, { rejectWithValue }) => {
    const response = await erpPatch(`${erpUrls.users}/${id}/${active ? "activate" : "deactivate"}`, {});
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteUser = createAsyncThunk("erpUser/delete", async (id, { rejectWithValue }) => {
  const response = await erpDelete(`${erpUrls.users}/${id}`);
  if (!response?.success) return rejectWithValue(response?.message);
  return id;
});

const userSlice = createSlice({
  name: "erpUser",
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.currentLoading = true;
        state.current = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchUserById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createUser.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateUser.rejected, (state) => {
        state.saving = false;
      })
      .addCase(setUserStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?.id) {
          state.list = state.list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
        }
      });
  },
});

export const { clearCurrentUser } = userSlice.actions;

export const showUsers = (state) => state.erpUser.list;
export const showUsersTotal = (state) => state.erpUser.totalRecords;
export const showUsersLoading = (state) => state.erpUser.loading;
export const showCurrentErpUser = (state) => state.erpUser.current;
export const showCurrentErpUserLoading = (state) => state.erpUser.currentLoading;
export const showErpUserSaving = (state) => state.erpUser.saving;

export default userSlice.reducer;
