import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { urls } from "global/config";
import { getRequestMethod, postRequestMethod } from "api";
import { formatDropdownData } from "global/helper";
import i18n from "i18next";

/** Current app language for customer APIs: "en" | "ar" */
const getCustomerLang = () => (i18n.language === "ar" ? "ar" : "en");

const initialState = {
  customers: null,
  status: false,
  postStatus: false,
  currentTab: "all",
  currentPage: 1,
  currentCustomer: null,
  billingInfo: null,
  vehicleType: null,
  agentType: null,
  statusType: null,
  search: "",
  searchByPassportOrIqama: "",
  advancedFilters: false,
  dropdownCustomers: null,
  dropdownCustomerPage: 1,
  dropdownCustomerLoading: false,
  latestRequestId: null, // Track latest request to handle race conditions
  // Pagination state for customer filter dropdown (only data, page/searchQuery/loading managed in hook)
  customerDropdownFilterData: null, // Full response with result and total_records for filter pagination
};

// Define the async thunk fetching customers
export const fetchExistingCustomer = createAsyncThunk(
  "auth/fetchExistingCustomer",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_customer}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk fetching customers
export const fetchCustomer = createAsyncThunk(
  "auth/fetchCustomer",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_customer}?${queryString}`
    );
    return response;
  }
);

export const fetchDropdownCustomer = createAsyncThunk(
  "auth/fetchDropdownCustomer",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dropdwon_customer_get_all}?${queryString}`
    );
    return response;
  }
);
export const fetchDropdownCustomerAgency = createAsyncThunk(
  "auth/fetchDropdownCustomerAgency",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dropdwon_customerAgency_get_all}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk for fetching customers with pagination (for filter)
export const fetchDropdownCustomerFilter = createAsyncThunk(
  "auth/fetchDropdownCustomerFilter",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dropdwon_customer_get_all}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk for fetching customers by agency with pagination (for filter)
export const fetchDropdownAgencyCustomerFilter = createAsyncThunk(
  "auth/fetchDropdownAgencyCustomerFilter",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.dropdwon_customerAgency_get_all}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk fetching customers
export const fetchAdminCustomer = createAsyncThunk(
  "auth/fetchAdminCustomer",
  async (body) => {
    const params = { ...body, lang: getCustomerLang() };
    const queryString = new URLSearchParams(params).toString();
    const response = await getRequestMethod(
      `${urls.get_all_admin_customer}?${queryString}`
    );
    return response;
  }
);

// Define the async thunk delete customer
export const deleteCustomer = createAsyncThunk(
  "auth/deleteCustomer",
  async (body) => {
    const lang = getCustomerLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...body, lang };
    const response = await postRequestMethod(
      `${urls.delete_customer}`,
      payload
    );
    return response;
  }
);
export const deleteCustomerForAgency = createAsyncThunk(
  "auth/deleteCustomerForAgency",
  async (body) => {
    const lang = getCustomerLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...body, lang };
    const response = await postRequestMethod(
      `${urls.delete_customer_for_agency}`,
      payload
    );
    return response;
  }
);

// Define the async thunk fetching customers
export const getCurrentCustomer = createAsyncThunk(
  "auth/getCurrentCustomer",
  async (id) => {
    const lang = getCustomerLang();
    const response = await getRequestMethod(
      `${urls.get_customer}?_id=${id}&lang=${lang}`
    );
    return response;
  }
);

// Define the async thunk fetching customers
export const postCustomer = createAsyncThunk(
  "auth/postCustomer",
  async (body) => {
    const lang = getCustomerLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...body, lang };
    const response = await postRequestMethod(urls.add_customer, payload);
    return response;
  }
);

// Define the async thunk fetching customers
export const addBillingCustomer = createAsyncThunk(
  "auth/addBillingCustomer",
  async (body) => {
    const lang = getCustomerLang();
    const payload =
      body instanceof FormData
        ? (body.append("lang", lang), body)
        : { ...body, lang };
    const response = await postRequestMethod(urls.add_billing, payload);
    return response;
  }
);

// Define the async thunk fetching customers
export const getBillingCustomer = createAsyncThunk(
  "auth/getBillingCustomer",
  async (id) => {
    const lang = getCustomerLang();
    const response = await getRequestMethod(
      `${urls.get_billing}?_id=${id}&lang=${lang}`
    );
    return response;
  }
);

// Define the async thunk fetching customers
export const getVehicleType = createAsyncThunk(
  "auth/getVehicleType",
  async (params, { rejectWithValue }) => {
    try {
      const lang = getCustomerLang();
      const response = await getRequestMethod(
        `${urls.get_vehicle}?lang=${lang}`
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    addCustomer: (state, action) => {
      state.customers = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setPostStatus: (state, action) => {
      state.postStatus = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
    },
    setBillingInfo: (state, action) => {
      state.billingInfo = action.payload;
    },
    setAgentType: (state, action) => {
      state.agentType = action.payload;
    },
    setStatusType: (state, action) => {
      state.statusType = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setSearchByPassportOrIqama: (state, action) => {
      state.searchByPassportOrIqama = action.payload;
    },
    setAdvancedFilters: (state, action) => {
      state.advancedFilters = action.payload;
    },
    setDropdownCustomers: (state, action) => {
      state.dropdownCustomers = action.payload;
    },
    setDropdownCustomerPage: (state, action) => {
      state.dropdownCustomerPage = action.payload;
    },
    resetDropdownCustomers: (state) => {
      state.dropdownCustomers = null;
      state.dropdownCustomerPage = 1;
    },
    // Customer dropdown filter pagination reducers (simplified - only reset data)
    resetCustomerDropdownFilter: (state) => {
      state.customerDropdownFilterData = null;
    },
    resetInitialState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postCustomer.pending, (state) => {
        state.postStatus = true;
      })
      .addCase(postCustomer.fulfilled, (state) => {
        state.postStatus = false;
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.status = true;
      })
      .addCase(deleteCustomerForAgency.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCustomer.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.status = false;
        state.customers = action.payload;
      })
      .addCase(fetchAdminCustomer.pending, (state) => {
        state.status = true;
      })
      .addCase(fetchAdminCustomer.fulfilled, (state, action) => {
        state.status = false;
        state.customers = action.payload;
      })
      .addCase(fetchDropdownCustomer.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        // Store the latest requestId to handle race conditions
        state.latestRequestId = action.meta.requestId;
        if (page === 1) {
          state.status = true;
        } else {
          state.dropdownCustomerLoading = true;
        }
      })
      .addCase(fetchDropdownCustomer.fulfilled, (state, action) => {
        // Only update state if this is the latest request (prevents race conditions)
        if (state.latestRequestId !== action.meta.requestId) {
          return;
        }
        state.status = false;
        state.dropdownCustomerLoading = false;
        const page = action.meta.arg?.page || 1;
        if (page === 1) {
          state.dropdownCustomers = action.payload;
        } else {
          state.dropdownCustomers = {
            ...action.payload,
            result: [
              ...(state.dropdownCustomers?.result || []),
              ...action.payload.result,
            ],
          };
        }
      })
      .addCase(fetchDropdownCustomer.rejected, (state, action) => {
        // Only update state if this is the latest request
        if (state.latestRequestId !== action.meta.requestId) {
          return;
        }
        state.status = false;
        state.dropdownCustomerLoading = false;
      })
      .addCase(fetchDropdownCustomerAgency.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        // Store the latest requestId to handle race conditions
        state.latestRequestId = action.meta.requestId;
        if (page === 1) {
          state.status = true;
        } else {
          state.dropdownCustomerLoading = true;
        }
      })
      .addCase(fetchDropdownCustomerAgency.fulfilled, (state, action) => {
        // Only update state if this is the latest request (prevents race conditions)
        if (state.latestRequestId !== action.meta.requestId) {
          return;
        }
        state.status = false;
        state.dropdownCustomerLoading = false;
        const page = action.meta.arg?.page || 1;
        if (page === 1) {
          state.dropdownCustomers = action.payload;
        } else {
          state.dropdownCustomers = {
            ...action.payload,
            result: [
              ...(state.dropdownCustomers?.result || []),
              ...action.payload.result,
            ],
          };
        }
      })
      .addCase(fetchDropdownCustomerAgency.rejected, (state, action) => {
        // Only update state if this is the latest request
        if (state.latestRequestId !== action.meta.requestId) {
          return;
        }
        state.status = false;
        state.dropdownCustomerLoading = false;
      })
      .addCase(fetchExistingCustomer.fulfilled, (state, action) => {
        state.currentCustomer = action.payload.result;
      })
      .addCase(addBillingCustomer.pending, (state) => {
        state.status = true;
      })
      .addCase(getBillingCustomer.fulfilled, (state, action) => {
        state.billingInfo = action.payload?.result;
      })
      .addCase(getCurrentCustomer.fulfilled, (state, action) => {
        state.currentCustomer = action.payload.result;
      })
      .addCase(getVehicleType.pending, (state) => {
        state.status = true;
      })
      .addCase(getVehicleType.fulfilled, (state, action) => {
        state.status = false;
        state.vehicleType = action.payload;
      })
      .addCase(getVehicleType.rejected, (state) => {
        state.status = false;
        state.vehicleType = null;
      })
      .addCase(fetchDropdownCustomerFilter.fulfilled, (state, action) => {
        // Format customer data to add title field (combine first_name, last_name, and passport)
        const formattedData = formatDropdownData(
          "first_name",
          action.payload.result || [],
          "last_name",
          "passport"
        );
        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.customerDropdownFilterData = {
            result: formattedData,
            total_records: action.payload.total_records || 0,
          };
        } else {
          // Append data for pagination
          state.customerDropdownFilterData = {
            result: [
              ...(state.customerDropdownFilterData?.result || []),
              ...formattedData,
            ],
            total_records: action.payload.total_records || 0,
          };
        }
      })
      .addCase(fetchDropdownAgencyCustomerFilter.fulfilled, (state, action) => {
        // Format customer data to add title field (combine first_name, last_name, and passport)
        const formattedData = formatDropdownData(
          "first_name",
          action.payload.result || [],
          "last_name",
          "passport"
        );
        // Get page from action.meta.arg (original arguments passed to thunk)
        const page = action.meta.arg?.page || 1;

        if (page === 1) {
          // First page or search reset - replace data
          state.customerDropdownFilterData = {
            result: formattedData,
            total_records: action.payload.total_records || 0,
          };
        } else {
          // Append data for pagination
          state.customerDropdownFilterData = {
            result: [
              ...(state.customerDropdownFilterData?.result || []),
              ...formattedData,
            ],
            total_records: action.payload.total_records || 0,
          };
        }
      });
  },
});

export const {
  addCustomer,
  setStatus,
  setCurrentPage,
  setCurrentCustomer,
  setBillingInfo,
  setAgentType,
  setStatusType,
  setSearch,
  setSearchByPassportOrIqama,
  setAdvancedFilters,
  setDropdownCustomers,
  setDropdownCustomerPage,
  resetDropdownCustomers,
  resetCustomerDropdownFilter,
  resetInitialState,
} = customerSlice.actions;

export const showCustomer = (state) => state.customer.customers;
export const showStatus = (state) => state.customer.status;
export const showPostStatus = (state) => state.customer.postStatus;
export const showCurrentPage = (state) => state.customer.currentPage;
export const showCurrentCustomer = (state) => state.customer.currentCustomer;
export const showBillingInfo = (state) => state.customer.billingInfo;
export const showVehicleType = (state) => state.customer.vehicleType;
export const showAgentType = (state) => state.customer.agentType;
export const showStatusType = (state) => state.customer.statusType;
export const showSearch = (state) => state.customer.search;
export const showSearchByPassportOrIqama = (state) =>
  state.customer.searchByPassportOrIqama;
export const showAdvancedFilters = (state) => state.customer.advancedFilters;
export const showDropdownCustomers = (state) =>
  state.customer.dropdownCustomers;
export const showDropdownCustomerPage = (state) =>
  state.customer.dropdownCustomerPage;
export const showDropdownCustomerLoading = (state) =>
  state.customer.dropdownCustomerLoading;
// Pagination selector for customer dropdown filter (only data, other states managed in hook)
export const showCustomerDropdownFilterData = (state) =>
  state.customer.customerDropdownFilterData;

export default customerSlice.reducer;
