import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SESSION_ERROR } from "global/config";
import i18n from "i18next";

const initialState = {
  userData: {},
  token: "",
  email: "",
  password: "",
  editRoleData: null,
  companyId: "",
  customerId: "",
  staffId: "",
  userRoles: [],
};

export const clearLoginData = createAsyncThunk(
  "unique/clearLoginData",
  async ({ navigate, isExpire }, { dispatch }) => {
    if (isExpire && localStorage.getItem("lng") === "ar") {
      localStorage.setItem("lng", "en");
      i18n.changeLanguage("en");
      document.body.dir = "ltr";
    }
    dispatch(clearToken());
    const url = window.location.pathname;
    navigate("/");
    if (isExpire && url !== "/") {
      alert(SESSION_ERROR);
    }
  }
);

const uniqueSlice = createSlice({
  name: "unique",
  initialState,
  reducers: {
    clearToken: (state) => {
      state.token = "";
    },
    clearUserData: (state) => {
      state.userData = {};
      state.userRoles = [];
    },
    addUserData: (state, action) => {
      state.userData = action.payload;
    },
    addToken: (state, action) => {
      state.token = action.payload;
    },
    addEmail: (state, action) => {
      state.email = action.payload;
    },
    addPassword: (state, action) => {
      state.password = action.payload;
    },
    addEditableRoleData: (state, action) => {
      state.editRoleData = action.payload;
    },
    addCompanyId: (state, action) => {
      state.companyId = action.payload;
    },
    addCustomerId: (state, action) => {
      state.customerId = action.payload;
    },
    addStaffId: (state, action) => {
      state.staffId = action.payload;
    },
    addUserRoles: (state, action) => {
      state.userRoles = action.payload;
    },
  },
});

export const {
  clearToken,
  clearUserData,
  addUserData,
  addToken,
  addEmail,
  addPassword,
  addEditableRoleData,
  addCompanyId,
  addCustomerId,
  addStaffId,
  addUserRoles,
} = uniqueSlice.actions;

export const showUserData = (state) => state.unique.userData;
export const showToken = (state) => state.unique.token;
export const showEmail = (state) => state.unique.email;
export const showEditableRoleData = (state) => state.unique.editRoleData;
export const showPassword = (state) => state.unique.password;
export const showCompanyId = (state) => state.unique.companyId;
export const showCustomerId = (state) => state.unique.customerId;
export const showStaffId = (state) => state.unique.staffId;
export const showUserRoles = (state) => state.unique.userRoles;

export default uniqueSlice.reducer;
