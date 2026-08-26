import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { urls, erpUrls } from "global/config";
import { formatDropdownData } from "global/helper";
import { postRequestMethod, getRequestMethod } from "api";
import { erpPost } from "api/erpClient";
import { addUserData, addUserRoles, addToken, clearUserData } from "./uniqueSlice";
import i18n from "i18next";

// Real ERP login (D:/start/backend) — separate from the legacy loginUser
// thunk below, which talks to an unrelated backend. `portal: "merchant"`
// rejects credentials for any other role (backend's MSG_PORTAL_MISMATCH),
// so an Admin account can't log into this portal and vice versa.
export const loginErp = createAsyncThunk(
  "auth/loginErp",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    const response = await erpPost(erpUrls.login, { email, password, portal: "merchant" });
    if (!response?.success) {
      return rejectWithValue(response?.message || "Login failed");
    }
    dispatch(addToken(response.result.token));
    dispatch(addUserData(response.result.account));
    return response.result;
  },
);

// Real ERP logout (D:/start/backend) — the backend session is a stateless
// JWT with no server-side blacklist, so this call has no real side effect
// there beyond confirming the token is still valid; the actual sign-out is
// clearing the token/userData locally, done unconditionally by the caller
// regardless of whether this API call itself succeeds or fails.
export const logoutErp = createAsyncThunk(
  "auth/logoutErp",
  async (_arg, { dispatch, rejectWithValue }) => {
    const response = await erpPost(erpUrls.logout, {});
    dispatch(clearUserData());
    dispatch(addToken(""));
    if (!response?.success) {
      return rejectWithValue(response?.message || "Logout failed");
    }
    return response;
  },
);

// Real ERP forgot-password OTP request — always resolves success (even for
// an unknown email, the backend deliberately doesn't reveal that) unless
// the account is locked, in which case the backend rejects it outright.
export const requestPasswordResetOtpErp = createAsyncThunk(
  "auth/requestPasswordResetOtpErp",
  async (email, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.forgotPassword, { email });
    if (!response?.success) {
      return rejectWithValue(response?.message || "Failed to send OTP");
    }
    return response;
  },
);

export const verifyOtpErp = createAsyncThunk(
  "auth/verifyOtpErp",
  async ({ email, otp }, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.verifyOtp, { email, otp });
    if (!response?.success) {
      return rejectWithValue(response?.message || "Invalid or expired code");
    }
    return response;
  },
);

export const resetPasswordWithOtpErp = createAsyncThunk(
  "auth/resetPasswordWithOtpErp",
  async ({ email, otp, password }, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.resetPassword, { email, otp, password });
    if (!response?.success) {
      return rejectWithValue(response?.message || "Failed to reset password");
    }
    return response;
  },
);

/** Current app language for auth APIs: "en" | "ar" */
const getAuthLang = () => (i18n.language === "ar" ? "ar" : "en");

const initialState = {
  status: false,
  countries: [],
  states: [],
  cities: [],
  banks: [],
  userStatus: false,
  branding: null,
  cityStatus: false,
  currentPathname: "",
  previousPathname: "",
  // Pagination state for countries (only data, page/searchQuery/loading managed in hook)
  countriesData: null, // Full response with result and total_records
  // Pagination state for cities (only data, page/searchQuery/loading managed in hook)
  citiesData: null, // Full response with result and total_records
  // Pagination state for nationality (only data, page/searchQuery/loading managed in hook)
  nationalityData: null, // Full response with result and total_records
  // Pagination state for currency (only data, page/searchQuery/loading managed in hook)
  currencyData: null, // Full response with result and total_records
};

export const getBranding = createAsyncThunk(
  "auth/getBranding",
  async (body) => {
    const params = { ...body, lang: getAuthLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_branding}?${queryString}`,
    );
    return response;
  },
);

// Define the async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.login, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.logout, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.register, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.update_profile, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const checkOtp = createAsyncThunk(
  "auth/checkOtp",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.verify_otp, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.reset_password, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const forgetPassword = createAsyncThunk(
  "auth/forgetPassword",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.forget_password, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const generateOtp = createAsyncThunk(
  "auth/generateOtp",
  async (body, { rejectWithValue }) => {
    try {
      const lang = getAuthLang();
      const payload =
        body instanceof FormData
          ? (body.append("lang", lang), body)
          : { ...body, lang };
      const response = await postRequestMethod(urls.generate_otp, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk for login
export const getUserInfo = createAsyncThunk(
  "auth/getUserInfo",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const lang = getAuthLang();
      const response = await getRequestMethod(
        `${urls.get_user_info}?user_id=${id}&lang=${lang}`,
      );
      if (response?.result) {
        dispatch(addUserData(response?.result));
        const userRoles = response?.result?.user_id?.roles
          ?.map((item) =>
            item?.role_id?.role_actions?.map((roleAction) => roleAction?._id),
          )
          .flat()
          .filter(Boolean);
        dispatch(addUserRoles(userRoles));
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Define the async thunk fetching countries
export const fetchCountries = createAsyncThunk(
  "auth/fetchCountries",
  async () => {
    const lang = getAuthLang();
    const response = await getRequestMethod(
      `${urls.country}?page=1&limit=900&lang=${lang}`,
    );
    return response;
  },
);

// Define the async thunk for fetching countries with pagination and search
export const fetchCountriesDropdown = createAsyncThunk(
  "auth/fetchCountriesDropdown",
  async (body) => {
    const params = { ...body, lang: getAuthLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(`${urls.country}?${queryString}`);
    return response;
  },
);

// Define the async thunk for fetching cities
export const fetchCities = createAsyncThunk(
  "auth/fetchCities",
  async (counntryId) => {
    const lang = getAuthLang();
    const response = await getRequestMethod(
      `${urls.city}?page=1&limit=900&country_id=${counntryId}&lang=${lang}`,
    );
    return response;
  },
);

// Define the async thunk for fetching cities with pagination and search
export const fetchCitiesDropdown = createAsyncThunk(
  "auth/fetchCitiesDropdown",
  async (body) => {
    const params = { ...body, lang: getAuthLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(`${urls.city}?${queryString}`);
    return response;
  },
);

// Define the async thunk for fetching nationality with pagination and search
// Uses same API endpoint as countries but maintains separate state
export const fetchNationalityDropdown = createAsyncThunk(
  "auth/fetchNationalityDropdown",
  async (body) => {
    const params = { ...body, lang: getAuthLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(`${urls.country}?${queryString}`);
    return response;
  },
);

// Define the async thunk for fetching currency with pagination and search
// Uses same API endpoint as countries but filters for unique currencies
export const fetchCurrencyDropdown = createAsyncThunk(
  "auth/fetchCurrencyDropdown",
  async (body) => {
    const params = { ...body, lang: getAuthLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(`${urls.currency}?${queryString}`);
    return response;
  },
);

// Define the async thunk fetching banks
export const fetchBanks = createAsyncThunk("auth/fetchBanks", async () => {
  const lang = getAuthLang();
  const response = await getRequestMethod(
    `${urls.banks}?page=1&limit=900&lang=${lang}`,
  );
  return response;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    addEmail: (state, action) => {
      state.email = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    addStates: (state, action) => {
      state.states = action.payload;
    },
    addCities: (state, action) => {
      state.cities = action.payload;
    },
    updateNavigation: (state, action) => {
      state.previousPathname = state.currentPathname;
      state.currentPathname = action.payload;
    },
    // Countries pagination reducers (simplified - only reset data)
    resetCountriesDropdown: (state) => {
      state.countriesData = null;
    },
    // Cities pagination reducers (simplified - only reset data)
    resetCitiesDropdown: (state) => {
      state.citiesData = null;
    },
    // Nationality pagination reducers (simplified - only reset data)
    resetNationalityDropdown: (state) => {
      state.nationalityData = null;
    },
    // Currency pagination reducers (simplified - only reset data)
    resetCurrencyDropdown: (state) => {
      state.currencyData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanks.fulfilled, (state, action) => {
        state.banks = action.payload.result;
      })
      .addCase(loginErp.pending, (state) => {
        state.status = true;
      })
      .addCase(loginErp.fulfilled, (state) => {
        state.status = false;
      })
      .addCase(loginErp.rejected, (state) => {
        state.status = false;
      })
      .addCase(logoutErp.pending, (state) => {
        state.status = true;
      })
      .addCase(logoutErp.fulfilled, (state) => {
        state.status = false;
      })
      .addCase(logoutErp.rejected, (state) => {
        state.status = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = true;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = true;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = true;
      })
      .addCase(updateUser.pending, (state) => {
        state.status = true;
      })
      .addCase(forgetPassword.pending, (state) => {
        state.status = true;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = true;
      })
      .addCase(generateOtp.pending, (state) => {
        state.status = true;
      })
      .addCase(checkOtp.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCountries.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.status = false;
        state.countries = formatDropdownData("name", action.payload.result);
      })
      .addCase(fetchCountriesDropdown.fulfilled, (state, action) => {
        const formattedData = formatDropdownData("name", action.payload.result);
        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.countriesData = {
            result: formattedData,
            total_records: action.payload.total_records,
          };
        } else {
          // Append data for pagination
          state.countriesData = {
            result: [...(state.countriesData?.result || []), ...formattedData],
            total_records: action.payload.total_records,
          };
        }
      })
      .addCase(fetchCities.pending, (state) => {
        state.cityStatus = true;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.cityStatus = false;
        state.cities = formatDropdownData("name", action.payload.result);
      })
      .addCase(fetchCitiesDropdown.fulfilled, (state, action) => {
        // ar: use nameAr if present else name; en: use name
        const formattedData = action.payload.result?.map((item) => ({
          ...item,
          title:
            (i18n.language === "ar" && item.nameAr ? item.nameAr : item.name) ||
            "",
        }));
        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.citiesData = {
            result: formattedData,
            total_records: action.payload.total_records,
          };
        } else {
          // Append data for pagination
          state.citiesData = {
            result: [...(state.citiesData?.result || []), ...formattedData],
            total_records: action.payload.total_records,
          };
        }
      })
      .addCase(fetchNationalityDropdown.fulfilled, (state, action) => {
        // Format with "nationality" field instead of "name"
        const formattedData = formatDropdownData(
          "nationality",
          action.payload.result,
        );
        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.nationalityData = {
            result: formattedData,
            total_records: action.payload.total_records,
          };
        } else {
          // Append data for pagination
          state.nationalityData = {
            result: [
              ...(state.nationalityData?.result || []),
              ...formattedData,
            ],
            total_records: action.payload.total_records,
          };
        }
      })
      .addCase(fetchCurrencyDropdown.fulfilled, (state, action) => {
        // Extract unique currencies from countries data
        const currencyMap = new Map();
        action.payload.result.forEach((country) => {
          if (country.currency && !currencyMap.has(country.currency)) {
            currencyMap.set(country.currency, {
              _id: country._id,
              currency: country.currency,
              name: country.name,
              title: country.currency, // Use currency as title for dropdown
            });
          }
        });
        const uniqueCurrencies = Array.from(currencyMap.values());

        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.currencyData = {
            result: uniqueCurrencies,
            total_records: uniqueCurrencies.length,
          };
        } else {
          // For pagination, merge with existing currencies and remove duplicates
          const existingCurrencies = state.currencyData?.result || [];
          const mergedMap = new Map();

          // Add existing currencies
          existingCurrencies.forEach((curr) => {
            mergedMap.set(curr.currency, curr);
          });

          // Add new currencies
          uniqueCurrencies.forEach((curr) => {
            if (!mergedMap.has(curr.currency)) {
              mergedMap.set(curr.currency, curr);
            }
          });

          state.currencyData = {
            result: Array.from(mergedMap.values()),
            total_records: mergedMap.size,
          };
        }
      })
      .addCase(getUserInfo.pending, (state) => {
        state.userStatus = true;
      })
      .addCase(getUserInfo.fulfilled, (state) => {
        state.userStatus = false;
      })
      .addCase(getBranding.pending, (state) => {
        state.status = true;
      })
      .addCase(getBranding.fulfilled, (state, action) => {
        state.status = false;
        state.branding = action.payload.result;
      });
  },
});

export const {
  addEmail,
  setStatus,
  addStates,
  addCities,
  updateNavigation,
  resetCountriesDropdown,
  resetCitiesDropdown,
  resetNationalityDropdown,
  resetCurrencyDropdown,
} = authSlice.actions;

export const showStatus = (state) => state.auth.status;
export const showEmail = (state) => state.auth.email;
export const showCountries = (state) => state.auth.countries;
export const showCities = (state) => state.auth.cities;
export const showBanks = (state) => state.auth.banks;
export const showUserStatus = (state) => state.auth.userStatus;
export const showBranding = (state) => state.auth.branding;
export const showCityStatus = (state) => state.auth.cityStatus;
export const showCurrentPathname = (state) => state.auth.currentPathname;
export const showPreviousPathname = (state) => state.auth.previousPathname;
// Pagination selectors (only data, other states managed in hook)
export const showCountriesData = (state) => state.auth.countriesData;
export const showCitiesData = (state) => state.auth.citiesData;
export const showNationalityData = (state) => state.auth.nationalityData;
export const showCurrencyData = (state) => state.auth.currencyData;

export default authSlice.reducer;
