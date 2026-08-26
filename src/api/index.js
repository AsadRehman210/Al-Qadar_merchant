import axios from "axios";
import { store } from "store";
import { addToken } from "store/slices/uniqueSlice";
import { BASE_URL, UNAUTHORIZED, NETWORK_ERROR } from "global/config";
import { toast } from "react-toastify";
import { logOut } from "global/helper";

// Create an Axios instance with a base URL
const apiClient = axios.create({ baseURL: BASE_URL });
export const apiPayment = axios.create({ baseURL: BASE_URL });

// Global variable to ensure only one alert is shown at a time
let alertShown = false;
let logoutInProgress = false;

// Add a flag to track interceptor setup status
let interceptorsInitialized = false;

// Centralized function to handle token invalid scenarios
const handleTokenInvalid = (navigate, token) => {
  // Check if we already have a logout in progress or alert shown
  if (logoutInProgress || alertShown || !token) {
    return;
  }

  // Set flags to prevent multiple alerts/logouts
  alertShown = true;
  logoutInProgress = true;

  // Show alert and logout
  // alert(SESSION_ERROR);

  // Perform logout
  logOut(navigate);

  // Reset flags after a delay to allow for cleanup
  setTimeout(() => {
    alertShown = false;
    logoutInProgress = false;
  }, 100);
};

// Function to initialize interceptors with navigate
export const setupInterceptors = (navigate) => {
  // Clear any existing interceptors to prevent duplicates
  apiClient.interceptors.request.eject(
    apiClient.interceptors.request.handlers[0]
  );
  apiClient.interceptors.response.eject(
    apiClient.interceptors.response.handlers[0]
  );

  // Request interceptor for apiClient
  apiClient.interceptors.request.use(
    (config) => {
      const state = store.getState();
      const token = state.unique.token; // Retrieve token from redux
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Add token to request headers
      }
      return config;
    },
    (error) => Promise.reject(error) // Return promise rejection if there's an error in request configuration
  );

  // Response interceptor for apiClient to handle specific response cases
  apiClient.interceptors.response.use(
    (response) => {
      const token = store.getState().unique.token;
      // Store new token if present in response
      if (response?.data?.token) {
        store.dispatch(addToken(response.data.token));
      }

      // Handle unauthorized response
      if (response?.data?.response_code === UNAUTHORIZED) {
        handleTokenInvalid(navigate, token);
      }
      return response;
    },
    (error) => {
      if (error.message === "Network Error" && !navigator.onLine) {
        if (!alertShown) {
          alertShown = true;
          toast.error(NETWORK_ERROR);
          setTimeout(() => {
            alertShown = false;
          }, 5000);
        }
      }
      return Promise.reject(error);
    }
  );

  // Set flag to indicate interceptors are initialized
  interceptorsInitialized = true;
  return true;
};

// Function to check if interceptors are initialized
export const areInterceptorsInitialized = () => {
  return interceptorsInitialized;
};

// Export API methods to be used in other parts of the application
export const getRequestMethod = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    return error.response;
  }
};

export const postRequestMethod = async (endpoint, data, header = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, header);
    return response.data;
  } catch (error) {
    return error.response;
  }
};

export const putRequestMethod = async (endpoint, data, header = {}) => {
  try {
    const response = await apiClient.put(endpoint, data, header);
    return response.data;
  } catch (error) {
    return error.response;
  }
};

export const deleteRequestMethod = async (endpoint, header = {}) => {
  try {
    const response = await apiClient.delete(endpoint, { headers: header });
    return response.data;
  } catch (error) {
    return error.response;
  }
};

export const patchRequestMethod = async (endpoint, data, header = {}) => {
  try {
    const response = await apiClient.patch(endpoint, data, header);
    return response.data;
  } catch (error) {
    console.error("PATCH request error:", error);
    return error.response;
  }
};

export default apiClient;
