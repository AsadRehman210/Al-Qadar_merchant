import axios from "axios";
import { store } from "store";
import { addToken } from "store/slices/uniqueSlice";
import { logOut } from "global/helper";
import { ERP_BASE_URL } from "global/config";

// Dedicated client for the real ERP backend (D:/start/backend). The
// pre-existing `apiClient` in ./index.js talks to an unrelated legacy
// (vehicle/travel) backend — ERP calls need their own base URL and their
// own envelope handling, since the ERP backend always responds with HTTP
// 200 and encodes success/failure in the JSON body (error_code/success).
const erpClient = axios.create({ baseURL: ERP_BASE_URL });

// Exact text the backend sends when an account is deactivated or a
// merchant's payment has expired (middleware/auth.ts + auth-service login).
// Matched literally because de_active and no_access share the same 403 code,
// so error_code alone can't tell "session is dead" apart from an ordinary
// permission denial.
const DEACTIVATED_MESSAGE =
  "User account is deactivated. Please contact support for assistance.";

let erpInterceptorsInitialized = false;

export const setupErpInterceptors = (navigate) => {
  if (erpInterceptorsInitialized) return;

  erpClient.interceptors.request.use((config) => {
    const token = store.getState().unique.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  erpClient.interceptors.response.use((response) => {
    const body = response.data;
    // The backend re-signs and returns a fresh token on every response —
    // keep redux in sync so the instant-revocation check on the next
    // request always sees the latest one.
    if (body?.token) store.dispatch(addToken(body.token));

    const sessionDead =
      body?.success === false &&
      (body.error_code === 401 || body.message === DEACTIVATED_MESSAGE);

    if (sessionDead) {
      logOut(navigate);
    }
    return response;
  });

  erpInterceptorsInitialized = true;
};

export const areErpInterceptorsInitialized = () => erpInterceptorsInitialized;

const unwrap = (promise) =>
  promise
    .then((res) => res.data)
    .catch(
      (err) =>
        err.response?.data || {
          success: false,
          error_code: null,
          message: err.message,
          result: null,
        },
    );

// Every list endpoint in this backend answers a legitimately empty result
// set with { success: false, error_code: 404 } rather than an empty array
// (see e.g. department-controller's getAll) — list thunks must treat that
// as "zero records", not surface it as a fetch error.
export const isEmptyListResponse = (response) =>
  response?.success === false && response?.error_code === 404;

// `new URLSearchParams({ ...params })` stringifies an `undefined` value to
// the literal text "undefined" (e.g. `?departmentId=undefined`), which the
// backend then tries to cast as a real value — crashing list endpoints that
// don't guard for it (Mongoose ObjectId cast errors, etc). Every list thunk
// builds its query params as `field: value || undefined` for "no filter
// selected", so this must be filtered out before the query string is built,
// not just at each individual call site.
export const buildQuery = (params) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return new URLSearchParams(clean).toString();
};

export const erpGet = (endpoint, config) => unwrap(erpClient.get(endpoint, config));
export const erpPost = (endpoint, data, config) => unwrap(erpClient.post(endpoint, data, config));
export const erpPut = (endpoint, data, config) => unwrap(erpClient.put(endpoint, data, config));
export const erpPatch = (endpoint, data, config) => unwrap(erpClient.patch(endpoint, data, config));
export const erpDelete = (endpoint, config) => unwrap(erpClient.delete(endpoint, config));

export default erpClient;
