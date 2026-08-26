import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { urls } from "global/config";
import { getRequestMethod, postRequestMethod } from "api";

const initialState = {
  companys: null,
  status: false,
  currentTab: "all",
  currentPage: 1,
};

// Define the async thunk fetching companys
export const fetchCompany = createAsyncThunk(
  "auth/fetchCompany",
  async (body) => {
    const queryString = new URLSearchParams(body).toString();
    const response = await getRequestMethod(
      `${urls.get_all_company}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk delete company
export const deletecompany = createAsyncThunk(
  "auth/deletecompany",
  async (id) => {
    const response = await postRequestMethod(`${urls.delete_company}`, id);
    return response;
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    addCompany: (state, action) => {
      state.companys = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deletecompany.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCompany.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.status = false;
        state.companys = action.payload;
      });
  },
});

export const { addCompany, setStatus, setCurrentPage } = companySlice.actions;

export const showCompany = (state) => state.company.companys;
export const showStatus = (state) => state.company.status;
export const showCurrentPage = (state) => state.company.currentPage;

export default companySlice.reducer;
