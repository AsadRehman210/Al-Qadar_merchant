import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRequestMethod, postRequestMethod } from "api";
import { urls } from "global/config";
import i18n from "i18next";

/** Current app language for header APIs: "en" | "ar" */
const getHeaderLang = () => (i18n.language === "ar" ? "ar" : "en");

// Define the async thunk fetching countries
export const fetchNotifications = createAsyncThunk(
  "auth/fetchNotifications",
  async (body) => {
    const params =
      typeof body === "object" && body !== null
        ? { ...body, lang: getHeaderLang() }
        : { lang: getHeaderLang() };
    const searchParams = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_notification}?${searchParams}`
    );
    return response;
  }
);

// Define the async thunk fetching countries
export const fetchAllNotifications = createAsyncThunk(
  "auth/fetchAllNotifications",
  async (body) => {
    const params =
      typeof body === "object" && body !== null
        ? { ...body, lang: getHeaderLang() }
        : { lang: getHeaderLang() };
    const searchParams = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_notification}?${searchParams}`
    );
    return response;
  }
);

// Define the async thunk fetching Driver
export const markAllReadNotification = createAsyncThunk(
  "auth/markAllReadNotification",
  async (body) => {
    const lang = getHeaderLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...(body || {}), lang };
    const response = await postRequestMethod(
      urls.post_mark_all_read_notification,
      payload
    );
    return response;
  }
);

export const postMarkAsRead = createAsyncThunk(
  "auth/postMarkAsRead",
  async (body) => {
    const lang = getHeaderLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...(body || {}), lang };
    const response = await postRequestMethod(urls.mark_as_read, payload);
    return response;
  }
);

const initialState = {
  sidebar: false,
  notifications: null,
  status: false,
  allNotifications: null,
  allStatus: false,
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    toggleSidebar: (state, action) => {
      state.sidebar = action.payload;
    },
    updateNotification: (state, action) => {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload.id
          ? { ...notification, read: action.payload.read }
          : notification
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.status = false;
      })
      .addCase(fetchAllNotifications.pending, (state) => {
        state.allStatus = true;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.allNotifications = action.payload;
        state.allStatus = false;
      });
  },
});

export const { toggleSidebar, updateNotification, updateCount } =
  headerSlice.actions;

export const showSidebar = (state) => state.header.sidebar;
export const showNotifications = (state) => state.header.notifications;
export const showAllNotifications = (state) => state.header.allNotifications;
export const showStatus = (state) => state.header.status;
export const showAllStatus = (state) => state.header.allStatus;

export default headerSlice.reducer;
