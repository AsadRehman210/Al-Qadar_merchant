import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { urls } from "global/config";
import { getRequestMethod } from "api";
import i18n from "i18next";

/** Current app language for dashboard APIs: "en" | "ar" */
const getDashboardLang = () => (i18n.language === "ar" ? "ar" : "en");

const getCurrentDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};
const getThirtyDaysAgo = () => {
  const now = new Date();
  now.setDate(now.getDate() - 29); // go back 29 days (so total 30 days incl. today)
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};

const getFirstDateOfCurrentMonth = () => {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `01 ${month} ${year}`;
};
const initialState = {
  dashboards: null,
  status: false,
  currentPage: 1,
  search: "",
  startDate: getThirtyDaysAgo(),
  endDate: getCurrentDate(),
  dashboardsByDate: null,
  statusByDate: false,
  monthlyStartDate: getThirtyDaysAgo(),
  monthlyEndDate: getCurrentDate(),
};

// Fetch all FAQs
export const fetchDashboard = createAsyncThunk(
  "dashboard/fetchDashboard",
  async (body) => {
    const params = { ...body, lang: getDashboardLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dashboard_analytics}?${queryString}`
    );
    return response;
  }
);
// 30 days analytics
export const fetchDashboardByDate = createAsyncThunk(
  "dashboard/fetchDashboardByDate",
  async (body) => {
    const params = { ...body, lang: getDashboardLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dashboard_analytics_by_date}?${queryString}`
    );
    return response;
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setStartDate: (state, action) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action) => {
      state.endDate = action.payload;
    },
    setMonthlyStartDate: (state, action) => {
      state.monthlyStartDate = action.payload;
    },
    setMonthlyEndDate: (state, action) => {
      state.monthlyEndDate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = false;
        state.dashboards = action.payload?.result;
      })
      .addCase(fetchDashboardByDate.pending, (state) => {
        state.statusByDate = true;
      })
      .addCase(fetchDashboardByDate.fulfilled, (state, action) => {
        state.statusByDate = false;
        state.dashboardsByDate = action.payload?.result;
      });
  },
});

export const {
  setStatus,
  setCurrentPage,
  setSearch,
  setStartDate,
  setEndDate,
  setMonthlyStartDate,
  setMonthlyEndDate,
} = dashboardSlice.actions;

export const showDashboard = (state) => state.dashboard.dashboards;
export const showStatus = (state) => state.dashboard.status;
export const showCurrentPage = (state) => state.dashboard.currentPage;
export const showSearch = (state) => state.dashboard.search;
export const showStartDate = (state) => state.dashboard.startDate;
export const showEndDate = (state) => state.dashboard.endDate;
export const showDashboardByDate = (state) => state.dashboard.dashboardsByDate;
export const showStatusByDate = (state) => state.dashboard.statusByDate;
export const showMonthlyStartDate = (state) => state.dashboard.monthlyStartDate;
export const showMonthlyEndDate = (state) => state.dashboard.monthlyEndDate;
export default dashboardSlice.reducer;
