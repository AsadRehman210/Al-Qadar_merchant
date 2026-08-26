import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { calender_filter_days } from "global/constant";
import { getRequestMethod } from "api";
import { urls } from "global/config";
import { postRequestMethod } from "../../api";
import i18n from "i18next";

/** Current app language for appointment APIs: "en" | "ar" */
const getAppointmentLang = () => (i18n.language === "ar" ? "ar" : "en");

// 1. Initial State
const initialState = {
  currentViewName: calender_filter_days[0], // Default view (Day/Week)
  selTeam: [], // Currently selected team members
  status: false, // Loading state
  driver: null,
  vehicles: null,
  BookingCalendar: null,
  start_date: "",
  end_date: "",
  teamType: { id: "driver", title: "driver" },
  driverStatus: false,
  driverDropdownPage: 1,
  driverDropdownLoading: false,
  latestDriverRequestId: null,
  calendarLoading: false, // New loading state for calendar data
};

export const deleteAppointments = createAsyncThunk(
  "appointment/deleteAppointments",
  async ({ id }, { rejectWithValue }) => {
    try {
      const payload = { id, lang: getAppointmentLang() };
      const response = await postRequestMethod(
        `${urls.del_appointment}`,
        payload
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// Define the async thunk fetching Driver
export const fetchDriver = createAsyncThunk(
  "appointment/fetchDriver",
  async (body) => {
    const params = { ...body, lang: getAppointmentLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_driver}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk fetching variant
export const fetchVehicles = createAsyncThunk(
  "appointment/fetchVehicles",
  async (body) => {
    const params = { ...body, lang: getAppointmentLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_vehicle}?${queryString}`
    );
    return response;
  }
);

export const fetchBookingCalendar = createAsyncThunk(
  "appointment/fetchBookingCalendar",
  async (body) => {
    const lang = getAppointmentLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...body, lang };
    const response = await postRequestMethod(
      urls.get_calendar_booking,
      payload
    );
    return response;
  }
);
// 3. Create the Slice
const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    // Synchronous actions
    setCurrentViewName: (state, action) => {
      state.currentViewName = action.payload;
    },
    setSelTeam: (state, action) => {
      state.selTeam = action.payload;
    },
    setStartDate: (state, action) => {
      state.start_date = action.payload;
    },
    setEndDate: (state, action) => {
      state.end_date = action.payload;
    },
    setTeamType: (state, action) => {
      state.teamType = action.payload;
    },
    setCalendarLoading: (state, action) => {
      state.calendarLoading = action.payload;
    },
    setDriverDropdownPage: (state, action) => {
      state.driverDropdownPage = action.payload;
    },
    resetDriverDropdown: (state) => {
      state.driver = null;
      state.driverDropdownPage = 1;
      state.driverDropdownLoading = false;
      state.latestDriverRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriver.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        state.latestDriverRequestId = action.meta.requestId;
        if (page === 1) {
          state.driverStatus = true;
        } else {
          state.driverDropdownLoading = true;
        }
      })
      .addCase(fetchDriver.fulfilled, (state, action) => {
        if (state.latestDriverRequestId !== action.meta.requestId) return;

        const page = action.meta.arg?.page || 1;
        state.driverStatus = false;
        state.driverDropdownLoading = false;

        if (page === 1) {
          state.driver = action.payload;
        } else {
          state.driver = {
            ...action.payload,
            result: [
              ...(state.driver?.result || []),
              ...(action.payload?.result || []),
            ],
          };
        }
      })
      .addCase(fetchDriver.rejected, (state, action) => {
        if (state.latestDriverRequestId !== action.meta.requestId) return;
        state.driverStatus = false;
        state.driverDropdownLoading = false;
      })
      .addCase(fetchVehicles.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchBookingCalendar.pending, (state) => {
        state.status = true;
        state.calendarLoading = true;
      })
      .addCase(fetchBookingCalendar.fulfilled, (state, action) => {
        state.status = false;
        state.calendarLoading = false;
        state.BookingCalendar = action.payload;
      })
      .addCase(fetchBookingCalendar.rejected, (state) => {
        state.status = false;
        state.calendarLoading = false;
      });
  },
});

// 4. Export Actions and Selectors
export const {
  setCurrentViewName,
  setSelTeam,
  setStartDate,
  setEndDate,
  setTeamType,
  setCalendarLoading,
  setDriverDropdownPage,
  resetDriverDropdown,
} = appointmentSlice.actions;

export const showViewName = (state) =>
  state.appointment.currentViewName || calender_filter_days[0];
export const showSelTeam = (state) => state.appointment.selTeam;

// appointments
export const showAppointments = (state) => state.appointment.appointments;
export const showstatus = (state) => state.appointment.status;
export const showDriver = (state) => state.appointment.driver;
export const showDriverDropdownPage = (state) =>
  state.appointment.driverDropdownPage;
export const showDriverDropdownLoading = (state) =>
  state.appointment.driverDropdownLoading;
export const showVehicles = (state) => state.appointment.vehicles;
export const showBookingCalendar = (state) => state.appointment.BookingCalendar;
export const showStartDate = (state) => state.appointment.start_date;
export const showEndDate = (state) => state.appointment.end_date;
export const showTeamType = (state) => state.appointment.teamType;
export const showDriverStatus = (state) => state.appointment.driverStatus;
export const showCalendarLoading = (state) => state.appointment.calendarLoading;

export default appointmentSlice.reducer;
