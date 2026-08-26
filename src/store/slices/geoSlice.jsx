// Country/City reference data — served by the backend's own /geo endpoints
// (backed by the country-state-city package server-side) so the frontend
// never has to bundle that dataset itself. Same paginated/searchable
// dropdown-source contract every other picker in this app uses.
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, isEmptyListResponse, buildQuery } from "api/erpClient";
import { DROPDOWN_PAGE_LIMIT } from "global/constant";

const initialState = {
  countryOptions: [],
  countryPage: 1,
  countryHasMore: false,
  countryLoading: false,

  cityOptions: [],
  cityPage: 1,
  cityHasMore: false,
  cityLoading: false,
};

export const fetchCountriesDropdown = createAsyncThunk(
  "geo/fetchCountries",
  async ({ page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.countries}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

// countryCode undefined/null means no country picked yet — the thunk still
// needs to be a no-op in that case, handled by the caller gating `enabled`
// on the dropdown source, same as the variant picker gates on warehouseId.
export const fetchCitiesDropdown = createAsyncThunk(
  "geo/fetchCities",
  async ({ countryCode, page = 1, search = "" } = {}, { rejectWithValue }) => {
    const query = buildQuery({ page, limit: DROPDOWN_PAGE_LIMIT, search });
    const response = await erpGet(`${erpUrls.countries}/${countryCode}/cities?${query}`);
    if (isEmptyListResponse(response)) return { result: [], page, total_pages: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return { result: response.result, page, total_pages: response.total_pages };
  },
);

const geoSlice = createSlice({
  name: "geo",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountriesDropdown.pending, (state) => {
        state.countryLoading = true;
      })
      .addCase(fetchCountriesDropdown.fulfilled, (state, action) => {
        state.countryLoading = false;
        const { result, page, total_pages } = action.payload;
        state.countryOptions = page === 1 ? result : [...state.countryOptions, ...result];
        state.countryPage = page;
        state.countryHasMore = page < total_pages;
      })
      .addCase(fetchCountriesDropdown.rejected, (state) => {
        state.countryLoading = false;
      })
      .addCase(fetchCitiesDropdown.pending, (state) => {
        state.cityLoading = true;
      })
      .addCase(fetchCitiesDropdown.fulfilled, (state, action) => {
        state.cityLoading = false;
        const { result, page, total_pages } = action.payload;
        state.cityOptions = page === 1 ? result : [...state.cityOptions, ...result];
        state.cityPage = page;
        state.cityHasMore = page < total_pages;
      })
      .addCase(fetchCitiesDropdown.rejected, (state) => {
        state.cityLoading = false;
      });
  },
});

export const showCountryDropdownOptions = (state) => state.geo.countryOptions;
export const showCountryDropdownPage = (state) => state.geo.countryPage;
export const showCountryDropdownHasMore = (state) => state.geo.countryHasMore;
export const showCountryDropdownLoading = (state) => state.geo.countryLoading;

export const showCityDropdownOptions = (state) => state.geo.cityOptions;
export const showCityDropdownPage = (state) => state.geo.cityPage;
export const showCityDropdownHasMore = (state) => state.geo.cityHasMore;
export const showCityDropdownLoading = (state) => state.geo.cityLoading;

export default geoSlice.reducer;
