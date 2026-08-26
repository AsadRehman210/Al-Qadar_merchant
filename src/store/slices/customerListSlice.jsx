import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
  filterStatus: null,
  currentPage: 1,
};

const customerListSlice = createSlice({
  name: "customerList",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  setSearch,
  setFilterStatus,
  setCurrentPage,
} = customerListSlice.actions;
export const showSearch = (state) => state.customerList.search;
export const showFilterStatus = (state) => state.customerList.filterStatus;
export const showCurrentPage = (state) => state.customerList.currentPage;
export default customerListSlice.reducer;
