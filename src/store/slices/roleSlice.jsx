import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  list: [],
  totalRecords: 0,
  activeRoles: [],
  current: null,
  currentLoading: false,
  loading: false,
  saving: false,
  error: null,
};

export const fetchRoles = createAsyncThunk("role/fetchAll", async (params, { rejectWithValue }) => {
  const query = buildQuery({ page: 1, limit: 10, ...params });
  const response = await erpGet(`${erpUrls.roles}?${query}`);
  if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
  if (!response?.success) return rejectWithValue(response?.message);
  return response;
});

export const fetchActiveRoles = createAsyncThunk("role/fetchActive", async (_, { rejectWithValue }) => {
  const response = await erpGet(erpUrls.activeRoles);
  if (isEmptyListResponse(response)) return [];
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result || [];
});

export const fetchRoleById = createAsyncThunk("role/fetchById", async (id, { rejectWithValue }) => {
  const response = await erpGet(`${erpUrls.roles}/${id}`);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const createRole = createAsyncThunk("role/create", async (data, { rejectWithValue }) => {
  const response = await erpPost(erpUrls.roles, data);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const updateRole = createAsyncThunk("role/update", async ({ id, data }, { rejectWithValue }) => {
  const response = await erpPut(`${erpUrls.roles}/${id}`, data);
  if (!response?.success) return rejectWithValue(response?.message);
  return response.result;
});

export const deleteRole = createAsyncThunk("role/delete", async (id, { rejectWithValue }) => {
  const response = await erpDelete(`${erpUrls.roles}/${id}`);
  if (!response?.success) return rejectWithValue(response?.message);
  return id;
});

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    clearCurrentRole: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.result || [];
        state.totalRecords = action.payload.total_records || 0;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.list = [];
        state.error = action.payload;
      })
      .addCase(fetchActiveRoles.fulfilled, (state, action) => {
        state.activeRoles = action.payload || [];
      })
      .addCase(fetchRoleById.pending, (state) => {
        state.currentLoading = true;
        state.current = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createRole.pending, (state) => {
        state.saving = true;
      })
      .addCase(createRole.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createRole.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateRole.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateRole.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateRole.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const { clearCurrentRole } = roleSlice.actions;

export const showRoles = (state) => state.role.list;
export const showRolesTotal = (state) => state.role.totalRecords;
export const showRolesLoading = (state) => state.role.loading;
export const showActiveRoles = (state) => state.role.activeRoles;
export const showCurrentRole = (state) => state.role.current;
export const showCurrentRoleLoading = (state) => state.role.currentLoading;
export const showRoleSaving = (state) => state.role.saving;

export default roleSlice.reducer;
