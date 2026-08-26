import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { urls } from "global/config";
import { getRequestMethod, postRequestMethod } from "api";
import { addStaffId } from "./uniqueSlice";
import { SUCCESS } from "global/config";

const initialState = {
  staff: null,
  status: false,
  currentTab: "all",
  currentPage: 1,
  currentStaff: null,
  billingInfo: null,
};

// Define the async thunk fetching staff
export const fetchStaff = createAsyncThunk("auth/fetchStaff", async (body) => {
  const queryString = new URLSearchParams(body).toString();
  const response = await getRequestMethod(
    `${urls.get_all_staff}?${queryString}`
  );
  return response;
});

// Define the async thunk delete Staff
export const deleteStaff = createAsyncThunk("auth/deleteStaff", async (id) => {
  const response = await postRequestMethod(`${urls.delete_staff}`, id);
  return response;
});

// Define the async thunk fetching staff
export const getCurrentStaff = createAsyncThunk(
  "auth/getCurrentStaff",
  async (id) => {
    const response = await getRequestMethod(`${urls.get_staff}?_id=${id}`);
    return response;
  }
);

// Define the async thunk fetching staff
export const postStaff = createAsyncThunk(
  "auth/postStaff",
  async (body, { dispatch }) => {
    const response = await postRequestMethod(urls.add_staff, body);
    if (response?.response_code === SUCCESS) {
      dispatch(addStaffId(response?.result?._id));
    }
    return response;
  }
);

// Define the async thunk fetching staff
export const addBillingStaff = createAsyncThunk(
  "auth/addBillingStaff",
  async (body) => {
    const response = await postRequestMethod(urls.add_billing, body);
    return response;
  }
);

// Define the async thunk fetching staff
export const getBillingStaff = createAsyncThunk(
  "auth/getBillingStaff",
  async (id) => {
    const response = await getRequestMethod(`${urls.get_billing}?_id=${id}`);
    return response;
  }
);

const stafflice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    addStaff: (state, action) => {
      state.staff = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setCurrentStaff: (state, action) => {
      state.currentStaff = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postStaff.pending, (state) => {
        state.status = true;
      })
      .addCase(postStaff.fulfilled, (state) => {
        state.status = false;
      })
      .addCase(deleteStaff.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchStaff.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = false;
        state.staff = action.payload;
      })
      .addCase(addBillingStaff.pending, (state) => {
        state.status = true;
      })
      .addCase(getBillingStaff.fulfilled, (state, action) => {
        state.billingInfo = action.payload?.result;
      })
      .addCase(getCurrentStaff.fulfilled, (state, action) => {
        state.currentStaff = action.payload.result;
      });
  },
});

export const { addStaff, setStatus, setCurrentPage, setCurrentStaff } =
  stafflice.actions;

export const showStaff = (state) => state.staff.staff;
export const showStatus = (state) => state.staff.status;
export const showCurrentPage = (state) => state.staff.currentPage;
export const showCurrentStaff = (state) => state.staff.currentStaff;
export const showBillingInfo = (state) => state.staff.billingInfo;

export default stafflice.reducer;
