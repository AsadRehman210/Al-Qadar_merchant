import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { formatDropdownData, formatDropdownNestedData } from "global/helper";

/**
 * Deep comparison helper for objects (more efficient than JSON.stringify)
 */
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every((key) => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null) {
      return deepEqual(val1, val2);
    }
    return val1 === val2;
  });
};

/**
 * Custom hook for managing multiple pagination dropdowns independently
 * Each dropdown (driver, vehicle) maintains its own LOCAL storage (data array, page, search, loading)
 * Redux slice is only used for API calls, not for storing dropdown-specific state
 * First-time API call happens only once per dropdown type
 * When search/pagination happens, only that specific dropdown's local state updates
 * Selected items are added to top of list if not present, and duplicates are prevented
 * 
 * @example
 * const dropdown_limit = 30;
 * const { drivers, vehicles } = useMultiplePaginationDropdowns({
 *   dropdown_limit,
 *   // Driver config
 *   driverConfig: {
 *     fetchAction: fetchDriver,
 *     resetAction: resetDriverDropdown,
 *     dataSelector: showDriver,
 *     additionalParams: { owner: "Admin Driver", is_drop_down: 1 },
 *   },
 *   // Vehicle config
 *   vehicleConfig: {
 *     fetchAction: fetchVehiclesDropdown,
 *     resetAction: resetVehicleDropdownList,
 *     dataSelector: showVehiclesDropdown,
 *     additionalParams: { vehicle_type_id: step1?.vehicle_type_id },
 *   },
 *   // Initial fetch trigger (only fetch once when this becomes true)
 *   shouldFetch: !!step1,
 * });
 * 
 * // Then use in SearchablePaginatedDropdown:
 * <SearchablePaginatedDropdown
 *   data={drivers.data}
 *   selected={drivers.normalizedSelectedItem}
 *   setSelected={setDriver}
 *   loading={drivers.loading}
 *   enableApiSearch={true}
 *   onApiSearch={drivers.onApiSearch}
 *   hasMore={drivers.hasMore}
 *   onLoadMore={drivers.onLoadMore}
 *   paginationLoading={drivers.paginationLoading}
 *   debounceTime={500}
 *   // ... other props
 * />
 * 
 * @param {Object} config - Configuration object
 * @param {number} config.dropdown_limit - Number of items per page (default: 30)
 * @param {Object} config.driverConfig - Configuration for driver dropdown
 * @param {Function} config.driverConfig.fetchAction - Redux async thunk action for fetching drivers
 * @param {Function} config.driverConfig.resetAction - Redux action to reset driver data
 * @param {Function} config.driverConfig.dataSelector - Redux selector for driver data
 * @param {Object} config.driverConfig.additionalParams - Additional parameters for driver fetch
 * @param {Object} config.driverConfig.selectedItem - Optional selected driver item
 * @param {Function} config.driverConfig.formatData - Optional function to format driver data (default: formatDropdownData("first_name", data, "last_name"))
 * @param {Object} config.vehicleConfig - Configuration for vehicle dropdown
 * @param {Function} config.vehicleConfig.fetchAction - Redux async thunk action for fetching vehicles
 * @param {Function} config.vehicleConfig.resetAction - Redux action to reset vehicle data
 * @param {Function} config.vehicleConfig.dataSelector - Redux selector for vehicle data
 * @param {Object} config.vehicleConfig.additionalParams - Additional parameters for vehicle fetch
 * @param {Object} config.vehicleConfig.selectedItem - Optional selected vehicle item
 * @param {Function} config.vehicleConfig.formatData - Optional function to format vehicle data (default: formatDropdownNestedData("make_id.title", data, "plate_no"))
 * @param {boolean} config.shouldFetch - Whether to trigger initial fetch (only fetches once when this becomes true)
 * 
 * @returns {Object} - Object containing driver and vehicle dropdown handlers
 * @returns {Object} returns.drivers - Driver dropdown handlers (same structure as usePaginationDropdown)
 * @returns {Object} returns.vehicles - Vehicle dropdown handlers (same structure as usePaginationDropdown)
 */
export const useMultiplePaginationDropdowns = ({
  dropdown_limit = 30,
  driverConfig = null,
  vehicleConfig = null,
  shouldFetch = true,
}) => {
  const dispatch = useDispatch();

  // Track if initial fetch has been done for each dropdown
  const driverInitializedRef = useRef(false);
  const vehicleInitializedRef = useRef(false);

  // Driver BASE data (from initial load - shared by all dropdowns)
  const [driverBaseData, setDriverBaseData] = useState([]);
  const [driverBaseTotalRecords, setDriverBaseTotalRecords] = useState(0);
  
  // Driver SEARCH state per dropdown (using Map to store state for each dropdown)
  // Key: dropdown identifier (from name prop), Value: { data, totalRecords, page, search, loading, paginationLoading }
  const [driverDropdownStates, setDriverDropdownStates] = useState(new Map());
  const [driverFirstPageLoading, setDriverFirstPageLoading] = useState(false);
  
  // Legacy state variables (for backward compatibility with old code)
  const [driverPage, setDriverPage] = useState(1);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverPaginationLoading, setDriverPaginationLoading] = useState(false);

  // Vehicle BASE data (from initial load - shared by all dropdowns)
  const [vehicleBaseData, setVehicleBaseData] = useState([]);
  const [vehicleBaseTotalRecords, setVehicleBaseTotalRecords] = useState(0);
  
  // Vehicle SEARCH state per dropdown (using Map to store state for each dropdown)
  const [vehicleDropdownStates, setVehicleDropdownStates] = useState(new Map());
  const [vehicleFirstPageLoading, setVehicleFirstPageLoading] = useState(false);
  
  // Legacy state variables (for backward compatibility with old code)
  const [vehiclePage, setVehiclePage] = useState(1);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehiclePaginationLoading, setVehiclePaginationLoading] = useState(false);

  // Don't read from Redux - we'll store API response directly in local state
  // This prevents one dropdown's search from affecting other dropdowns

  // Refs to track values for callbacks (avoid dependency issues)
  const driverPageRef = useRef(1);
  const driverSearchRef = useRef("");
  const driverAdditionalParamsRef = useRef(driverConfig?.additionalParams || {});
  const driverIsLoadingRef = useRef(false);

  const vehiclePageRef = useRef(1);
  const vehicleSearchRef = useRef("");
  const vehicleAdditionalParamsRef = useRef(vehicleConfig?.additionalParams || {});
  const vehicleIsLoadingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    driverPageRef.current = driverPage;
  }, [driverPage]);

  useEffect(() => {
    driverSearchRef.current = driverSearch;
  }, [driverSearch]);

  useEffect(() => {
    vehiclePageRef.current = vehiclePage;
  }, [vehiclePage]);

  useEffect(() => {
    vehicleSearchRef.current = vehicleSearch;
  }, [vehicleSearch]);

  // Memoize additionalParams to avoid unnecessary re-renders
  const driverAdditionalParamsMemo = useMemo(
    () => driverConfig?.additionalParams || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(driverConfig?.additionalParams)]
  );

  const vehicleAdditionalParamsMemo = useMemo(
    () => vehicleConfig?.additionalParams || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(vehicleConfig?.additionalParams)]
  );

  useEffect(() => {
    driverAdditionalParamsRef.current = driverAdditionalParamsMemo;
  }, [driverAdditionalParamsMemo]);

  useEffect(() => {
    vehicleAdditionalParamsRef.current = vehicleAdditionalParamsMemo;
  }, [vehicleAdditionalParamsMemo]);

  // Track previous additionalParams to detect changes
  const prevDriverParamsRef = useRef(driverConfig?.additionalParams || {});
  const prevVehicleParamsRef = useRef(vehicleConfig?.additionalParams || {});

  // Removed Redux sync useEffects - we'll store API response directly in local state

  /**
   * Initial fetch for drivers (only once when shouldFetch becomes true)
   */
  useEffect(() => {
    if (!driverConfig || !shouldFetch || driverInitializedRef.current) {
      return;
    }

    // Check if additionalParams changed (e.g., vehicle_type_id for vehicles)
    const currentParams = driverConfig.additionalParams || {};
    const paramsChanged = !deepEqual(prevDriverParamsRef.current, currentParams);

    if (paramsChanged) {
      prevDriverParamsRef.current = currentParams;
      driverInitializedRef.current = false; // Reset to allow refetch
      setDriverBaseData([]); // Clear base data
      setDriverBaseTotalRecords(0);
    }

    if (!driverInitializedRef.current) {
      driverInitializedRef.current = true;
      setDriverPage(1);
      driverPageRef.current = 1;
      setDriverSearch("");
      driverSearchRef.current = "";
      setDriverFirstPageLoading(true);
      driverIsLoadingRef.current = true;

      // Don't reset Redux - we're not using Redux state, only for API calls
      // dispatch(driverConfig.resetAction());

      const requestPromise = dispatch(
        driverConfig.fetchAction({
          page: 1,
          limit: dropdown_limit,
          search: "",
          ...(driverConfig.additionalParams || {}),
        })
      );

      requestPromise
        .unwrap()
        .then((response) => {
          // Store API response as BASE data (shared by all dropdowns)
          const formatDriverData = driverConfig.formatData || ((data) => formatDropdownData("first_name", data, "last_name"));
          const formattedData = formatDriverData(response.result || []);
          setDriverBaseData(formattedData);
          setDriverBaseTotalRecords(response.total_records || 0);
          setDriverFirstPageLoading(false);
          driverIsLoadingRef.current = false;
        })
        .catch(() => {
          setDriverFirstPageLoading(false);
          driverIsLoadingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldFetch,
    driverAdditionalParamsMemo,
    driverConfig?.fetchAction,
    driverConfig?.resetAction,
    dropdown_limit,
  ]);

  /**
   * Initial fetch for vehicles (only once when shouldFetch becomes true)
   */
  useEffect(() => {
    if (!vehicleConfig || !shouldFetch || vehicleInitializedRef.current) {
      return;
    }

    // Check if additionalParams changed (e.g., vehicle_type_id)
    const currentParams = vehicleConfig.additionalParams || {};
    const paramsChanged = !deepEqual(prevVehicleParamsRef.current, currentParams);

    if (paramsChanged) {
      prevVehicleParamsRef.current = currentParams;
      vehicleInitializedRef.current = false; // Reset to allow refetch
      setVehicleBaseData([]); // Clear base data
      setVehicleBaseTotalRecords(0);
    }

    if (!vehicleInitializedRef.current) {
      vehicleInitializedRef.current = true;
      setVehiclePage(1);
      vehiclePageRef.current = 1;
      setVehicleSearch("");
      vehicleSearchRef.current = "";
      setVehicleFirstPageLoading(true);
      vehicleIsLoadingRef.current = true;

      // Don't reset Redux - we're not using Redux state, only for API calls
      // dispatch(vehicleConfig.resetAction());

      const requestPromise = dispatch(
        vehicleConfig.fetchAction({
          page: 1,
          limit: dropdown_limit,
          search: "",
          ...(vehicleConfig.additionalParams || {}),
        })
      );

      requestPromise
        .unwrap()
        .then((response) => {
          // Store API response as BASE data (shared by all dropdowns)
          const formatVehicleData = vehicleConfig.formatData || ((data) => formatDropdownNestedData("make_id.title", data, "plate_no"));
          const formattedData = formatVehicleData(response.result || []);
          setVehicleBaseData(formattedData);
          setVehicleBaseTotalRecords(response.total_records || 0);
          setVehicleFirstPageLoading(false);
          vehicleIsLoadingRef.current = false;
        })
        .catch(() => {
          setVehicleFirstPageLoading(false);
          vehicleIsLoadingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldFetch,
    vehicleAdditionalParamsMemo,
    vehicleConfig?.fetchAction,
    vehicleConfig?.resetAction,
    dropdown_limit,
  ]);

  /**
   * Create a driver API search handler for a specific dropdown
   * Each dropdown gets its own handler that maintains separate state
   */
  const createDriverApiSearchHandler = useCallback(
    (dropdownId) => {
      return (searchValue) => {
        if (!driverConfig) return;

        // If search is empty, clear this dropdown's search state
        if (!searchValue || searchValue.trim() === "") {
          setDriverDropdownStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(dropdownId);
            return newMap;
          });
          return; // Don't make API call for empty search
        }

        // Update this dropdown's state
        setDriverDropdownStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(dropdownId, {
            data: [],
            totalRecords: 0,
            page: 1,
            search: searchValue,
            loading: true,
            paginationLoading: false,
          });
          return newMap;
        });

        dispatch(
          driverConfig.fetchAction({
            page: 1,
            limit: dropdown_limit,
            search: searchValue,
            ...driverAdditionalParamsRef.current,
          })
        )
          .unwrap()
          .then((response) => {
            // Store API response for this specific dropdown
            const formatDriverData = driverConfig.formatData || ((data) => formatDropdownData("first_name", data, "last_name"));
            const formattedData = formatDriverData(response.result || []);
            
            setDriverDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                data: formattedData,
                totalRecords: response.total_records || 0,
                loading: false,
                paginationLoading: false,
              });
              return newMap;
            });
          })
          .catch(() => {
            setDriverDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                loading: false,
                paginationLoading: false,
              });
              return newMap;
            });
          });
      };
    },
    [dispatch, driverConfig, dropdown_limit]
  );
  

  /**
   * Create a vehicle API search handler for a specific dropdown
   * Each dropdown gets its own handler that maintains separate state
   */
  const createVehicleApiSearchHandler = useCallback(
    (dropdownId) => {
      return (searchValue) => {
        if (!vehicleConfig) return;

        // If search is empty, clear this dropdown's search state and reset to base data
        if (!searchValue || searchValue.trim() === "") {
          setVehicleDropdownStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(dropdownId);
            return newMap;
          });
          // Clear legacy search state for backward compatibility (no longer needed but kept for compatibility)
          return; // Don't make API call for empty search
        }

        // Update this dropdown's state
        setVehicleDropdownStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(dropdownId, {
            data: [],
            totalRecords: 0,
            page: 1,
            search: searchValue,
            loading: true,
            paginationLoading: false,
          });
          return newMap;
        });

        dispatch(
          vehicleConfig.fetchAction({
            page: 1,
            limit: dropdown_limit,
            search: searchValue,
            ...vehicleAdditionalParamsRef.current,
          })
        )
          .unwrap()
          .then((response) => {
            // Store API response for this specific dropdown
            const formatVehicleData = vehicleConfig.formatData || ((data) => formatDropdownNestedData("make_id.title", data, "plate_no"));
            const formattedData = formatVehicleData(response.result || []);
            
            setVehicleDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                data: formattedData,
                totalRecords: response.total_records || 0,
                loading: false,
                paginationLoading: false,
              });
              return newMap;
            });
          })
          .catch(() => {
            setVehicleDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                loading: false,
                paginationLoading: false,
              });
              return newMap;
            });
          });
      };
    },
    [dispatch, vehicleConfig, dropdown_limit]
  );
  




  /**
   * Get handlers and data for a specific dropdown
   * This allows each dropdown to maintain its own search state
   * @param {string} dropdownId - Unique identifier for the dropdown
   * @param {Object} selectedItemOverride - Optional selected item for this specific dropdown (overrides config.selectedItem)
   */
  const getDriverHandlers = useCallback((dropdownId = "default", selectedItemOverride = null) => {
    if (!driverConfig) return null;
    
    const dropdownState = driverDropdownStates.get(dropdownId);
    const isSearching = !!dropdownState;
    const dataList = isSearching ? (dropdownState.data || []) : driverBaseData;
    const totalRecords = isSearching ? (dropdownState.totalRecords || 0) : driverBaseTotalRecords;
    const loading = isSearching ? (dropdownState.loading || false) : driverFirstPageLoading;
    const paginationLoading = isSearching ? (dropdownState.paginationLoading || false) : driverPaginationLoading;
    const searchQuery = isSearching ? (dropdownState.search || "") : "";
    
    // Process data with selected item - always put selected item at top and prevent duplicates
    // Use selectedItemOverride if provided, otherwise use config.selectedItem
    const selectedItem = selectedItemOverride !== null ? selectedItemOverride : driverConfig.selectedItem;
    let processedData = dataList;
    let normalizedSelected = selectedItem;
    
    // Always add selected item to top if it exists and we're not searching
    // This ensures selected item from editData appears at top even if not in initial list
    if (selectedItem && selectedItem._id && !isSearching) {
      const formatDriverData = driverConfig.formatData || ((data) => formatDropdownData("first_name", data, "last_name"));
      
      // Format the selected item - if it already has title, preserve it, otherwise format it
      let formattedSelectedDriver;
      if (selectedItem.title) {
        // Already formatted (from ApproveBooking), use as-is but ensure _id is string
        formattedSelectedDriver = {
          ...selectedItem,
          _id: String(selectedItem._id),
        };
      } else {
        // Need to format it
        formattedSelectedDriver = formatDriverData([selectedItem])[0] || {
          ...selectedItem,
          _id: String(selectedItem._id),
          title: `${selectedItem.first_name || ""} ${selectedItem.last_name || ""}`.trim(),
        };
      }
      
      // Ensure title exists for display
      if (!formattedSelectedDriver.title) {
        formattedSelectedDriver.title = `${selectedItem.first_name || ""} ${selectedItem.last_name || ""}`.trim() || String(selectedItem._id);
      }
      
      // Ensure _id is string for comparison
      const priorityId = String(formattedSelectedDriver._id);
      
      // Check if selected item is already in the list
      const itemInList = dataList.find((item) => String(item._id) === priorityId);
      
      // Always filter out the selected item from the list first to prevent duplicates
      const filteredList = dataList.filter((item) => String(item._id) !== priorityId);
      
      if (itemInList) {
        // Item is in list - use the list item and put it at top
        normalizedSelected = itemInList;
        processedData = [itemInList, ...filteredList];
      } else {
        // Item is not in list - add formatted version to top
        // This works even if dataList is empty (before API call completes)
        normalizedSelected = formattedSelectedDriver;
        processedData = [formattedSelectedDriver, ...filteredList];
      }
      
      // Selected item processing complete - item added to top of list
    }
    
    const hasMore = processedData.length < totalRecords;
    
    // Create per-dropdown loadMore function (not useCallback, just a regular function)
    const loadMoreForDropdown = () => {
      if (!driverConfig || driverIsLoadingRef.current) {
        return;
      }
      
      const currentDropdownState = driverDropdownStates.get(dropdownId);
      const isSearching = !!currentDropdownState;
      const currentData = isSearching ? (currentDropdownState.data || []) : driverBaseData;
      const currentTotal = isSearching ? (currentDropdownState.totalRecords || 0) : driverBaseTotalRecords;
      const currentPage = isSearching ? (currentDropdownState.page || 1) : driverPage;
      const currentSearch = isSearching ? (currentDropdownState.search || "") : driverSearch;
      
      if (currentData.length >= currentTotal) {
        return;
      }
      
      const nextPage = currentPage + 1;
      driverIsLoadingRef.current = true;
      
      // Update pagination loading state for this dropdown
      if (isSearching) {
        setDriverDropdownStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(dropdownId) || {};
          newMap.set(dropdownId, {
            ...currentState,
            paginationLoading: true,
          });
          return newMap;
        });
      } else {
        setDriverPage(nextPage);
        setDriverPaginationLoading(true);
      }
      
      dispatch(
        driverConfig.fetchAction({
          page: nextPage,
          limit: dropdown_limit,
          search: currentSearch,
          ...driverAdditionalParamsRef.current,
        })
      )
        .unwrap()
        .then((response) => {
          const formatDriverData = driverConfig.formatData || ((data) => formatDropdownData("first_name", data, "last_name"));
          const formattedData = formatDriverData(response.result || []);
          
          if (isSearching) {
            // Append to this dropdown's search data
            setDriverDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              const existingIds = new Set((currentState.data || []).map((item) => String(item._id)));
              const newItems = formattedData.filter(
                (item) => !existingIds.has(String(item._id))
              );
              newMap.set(dropdownId, {
                ...currentState,
                data: [...(currentState.data || []), ...newItems],
                totalRecords: response.total_records || 0,
                page: nextPage,
                paginationLoading: false,
              });
              return newMap;
            });
          } else {
            // Append to base data - ensure selected item stays at top and no duplicates
            setDriverBaseData((prevData) => {
              const existingIds = new Set(prevData.map((item) => String(item._id)));
              const newItems = formattedData.filter(
                (item) => !existingIds.has(String(item._id))
              );
              
              // Check if selected item exists and handle it
              const selectedItem = driverConfig.selectedItem;
              if (selectedItem && selectedItem._id) {
                const formatDriverData = driverConfig.formatData || ((data) => formatDropdownData("first_name", data, "last_name"));
                const formattedSelectedDriver = formatDriverData([selectedItem])[0] || selectedItem;
                const priorityId = String(formattedSelectedDriver._id);
                
                // Remove selected item from both prevData and newItems to prevent duplicates
                const filteredPrevData = prevData.filter((item) => String(item._id) !== priorityId);
                const filteredNewItems = newItems.filter((item) => String(item._id) !== priorityId);
                
                // Check if selected item appears in new items (from pagination)
                const selectedItemInNew = newItems.find((item) => String(item._id) === priorityId);
                
                // Always put selected item at top, whether it's from prevData, newItems, or needs to be added
                if (selectedItemInNew) {
                  // Selected item found in new paginated data - use it and put at top
                  return [selectedItemInNew, ...filteredPrevData, ...filteredNewItems];
                } else {
                  // Selected item not in new data - check if it was already in prevData
                  const selectedItemInPrev = prevData.find((item) => String(item._id) === priorityId);
                  if (selectedItemInPrev) {
                    // Was already in prevData, keep it at top
                    return [selectedItemInPrev, ...filteredPrevData, ...filteredNewItems];
                  } else {
                    // Not in prevData or newItems - add formatted version at top
                    return [formattedSelectedDriver, ...filteredPrevData, ...filteredNewItems];
                  }
                }
              }
              
              // No selected item - just append new items
              return [...prevData, ...newItems];
            });
            setDriverBaseTotalRecords(response.total_records || 0);
            setDriverPaginationLoading(false);
          }
          driverIsLoadingRef.current = false;
        })
        .catch(() => {
          if (isSearching) {
            setDriverDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                paginationLoading: false,
              });
              return newMap;
            });
          } else {
            setDriverPaginationLoading(false);
            setDriverPage((prev) => prev - 1);
          }
          driverIsLoadingRef.current = false;
        });
    };
    
    return {
      data: processedData,
      normalizedSelectedItem: normalizedSelected || driverConfig.selectedItem,
      loading,
      paginationLoading,
      hasMore,
      onLoadMore: loadMoreForDropdown,
      onApiSearch: createDriverApiSearchHandler(dropdownId),
      currentPage: isSearching ? (dropdownState.page || 1) : driverPage,
      searchQuery,
      totalRecords,
    };
  }, [driverConfig, driverDropdownStates, driverBaseData, driverBaseTotalRecords, driverFirstPageLoading, driverPaginationLoading, createDriverApiSearchHandler, driverPage, driverSearch, driverAdditionalParamsRef, dropdown_limit, dispatch]);
  
  /**
   * Get handlers and data for a specific dropdown
   * This allows each dropdown to maintain its own search state
   * @param {string} dropdownId - Unique identifier for the dropdown
   * @param {Object} selectedItemOverride - Optional selected item for this specific dropdown (overrides config.selectedItem)
   */
  const getVehicleHandlers = useCallback((dropdownId = "default", selectedItemOverride = null) => {
    if (!vehicleConfig) return null;
    
    const dropdownState = vehicleDropdownStates.get(dropdownId);
    const isSearching = !!dropdownState;
    const dataList = isSearching ? (dropdownState.data || []) : vehicleBaseData;
    const totalRecords = isSearching ? (dropdownState.totalRecords || 0) : vehicleBaseTotalRecords;
    const loading = isSearching ? (dropdownState.loading || false) : vehicleFirstPageLoading;
    const paginationLoading = isSearching ? (dropdownState.paginationLoading || false) : vehiclePaginationLoading;
    const searchQuery = isSearching ? (dropdownState.search || "") : "";
    
    // Process data with selected item - always put selected item at top and prevent duplicates
    // Use selectedItemOverride if provided, otherwise use config.selectedItem
    const selectedItem = selectedItemOverride !== null ? selectedItemOverride : vehicleConfig.selectedItem;
    let processedData = dataList;
    let normalizedSelected = selectedItem;
    
    // Always add selected item to top if it exists and we're not searching
    // This ensures selected item from editData appears at top even if not in initial list
    if (selectedItem && selectedItem._id && !isSearching) {
      const formatVehicleData = vehicleConfig.formatData || ((data) => formatDropdownNestedData("make_id.title", data, "plate_no"));
      
      // Format the selected item - if it already has title, preserve it, otherwise format it
      let formattedSelectedVehicle;
      if (selectedItem.title) {
        // Already formatted (from ApproveBooking), use as-is but ensure _id is string
        formattedSelectedVehicle = {
          ...selectedItem,
          _id: String(selectedItem._id),
        };
      } else {
        // Need to format it
        formattedSelectedVehicle = formatVehicleData([selectedItem])[0] || {
          ...selectedItem,
          _id: String(selectedItem._id),
          title: `${selectedItem.make_id?.title || ""} ${selectedItem.plate_no || ""}`.trim(),
        };
      }
      
      // Ensure title exists for display
      if (!formattedSelectedVehicle.title) {
        formattedSelectedVehicle.title = `${selectedItem.make_id?.title || ""} ${selectedItem.plate_no || ""}`.trim() || String(selectedItem._id);
      }
      
      // Ensure _id is string for comparison
      const priorityId = String(formattedSelectedVehicle._id);
      
      // Check if selected item is already in the list
      const itemInList = dataList.find((item) => String(item._id) === priorityId);
      
      // Always filter out the selected item from the list first to prevent duplicates
      const filteredList = dataList.filter((item) => String(item._id) !== priorityId);
      
      if (itemInList) {
        // Item is in list - use the list item and put it at top
        normalizedSelected = itemInList;
        processedData = [itemInList, ...filteredList];
      } else {
        // Item is not in list - add formatted version to top
        // This works even if dataList is empty (before API call completes)
        normalizedSelected = formattedSelectedVehicle;
        processedData = [formattedSelectedVehicle, ...filteredList];
      }
      
      // Selected item processing complete - item added to top of list
    }
    
    const hasMore = processedData.length < totalRecords;
    
    // Create per-dropdown loadMore function (not useCallback, just a regular function)
    const loadMoreForDropdown = () => {
      if (!vehicleConfig || vehicleIsLoadingRef.current) {
        return;
      }
      
      const currentDropdownState = vehicleDropdownStates.get(dropdownId);
      const isSearching = !!currentDropdownState;
      const currentData = isSearching ? (currentDropdownState.data || []) : vehicleBaseData;
      const currentTotal = isSearching ? (currentDropdownState.totalRecords || 0) : vehicleBaseTotalRecords;
      const currentPage = isSearching ? (currentDropdownState.page || 1) : vehiclePage;
      const currentSearch = isSearching ? (currentDropdownState.search || "") : vehicleSearch;
      
      if (currentData.length >= currentTotal) {
        return;
      }
      
      const nextPage = currentPage + 1;
      vehicleIsLoadingRef.current = true;
      
      // Update pagination loading state for this dropdown
      if (isSearching) {
        setVehicleDropdownStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(dropdownId) || {};
          newMap.set(dropdownId, {
            ...currentState,
            paginationLoading: true,
          });
          return newMap;
        });
      } else {
        setVehiclePage(nextPage);
        setVehiclePaginationLoading(true);
      }
      
      dispatch(
        vehicleConfig.fetchAction({
          page: nextPage,
          limit: dropdown_limit,
          search: currentSearch,
          ...vehicleAdditionalParamsRef.current,
        })
      )
        .unwrap()
        .then((response) => {
          const formatVehicleData = vehicleConfig.formatData || ((data) => formatDropdownNestedData("make_id.title", data, "plate_no"));
          const formattedData = formatVehicleData(response.result || []);
          
          if (isSearching) {
            // Append to this dropdown's search data
            setVehicleDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              const existingIds = new Set((currentState.data || []).map((item) => String(item._id)));
              const newItems = formattedData.filter(
                (item) => !existingIds.has(String(item._id))
              );
              newMap.set(dropdownId, {
                ...currentState,
                data: [...(currentState.data || []), ...newItems],
                totalRecords: response.total_records || 0,
                page: nextPage,
                paginationLoading: false,
              });
              return newMap;
            });
          } else {
            // Append to base data - ensure selected item stays at top and no duplicates
            setVehicleBaseData((prevData) => {
              const existingIds = new Set(prevData.map((item) => String(item._id)));
              const newItems = formattedData.filter(
                (item) => !existingIds.has(String(item._id))
              );
              
              // Check if selected item exists and handle it
              const selectedItem = vehicleConfig.selectedItem;
              if (selectedItem && selectedItem._id) {
                const formatVehicleData = vehicleConfig.formatData || ((data) => formatDropdownNestedData("make_id.title", data, "plate_no"));
                const formattedSelectedVehicle = formatVehicleData([selectedItem])[0] || selectedItem;
                const priorityId = String(formattedSelectedVehicle._id);
                
                // Remove selected item from both prevData and newItems to prevent duplicates
                const filteredPrevData = prevData.filter((item) => String(item._id) !== priorityId);
                const filteredNewItems = newItems.filter((item) => String(item._id) !== priorityId);
                
                // Check if selected item appears in new items (from pagination)
                const selectedItemInNew = newItems.find((item) => String(item._id) === priorityId);
                
                // Always put selected item at top, whether it's from prevData, newItems, or needs to be added
                if (selectedItemInNew) {
                  // Selected item found in new paginated data - use it and put at top
                  return [selectedItemInNew, ...filteredPrevData, ...filteredNewItems];
                } else {
                  // Selected item not in new data - check if it was already in prevData
                  const selectedItemInPrev = prevData.find((item) => String(item._id) === priorityId);
                  if (selectedItemInPrev) {
                    // Was already in prevData, keep it at top
                    return [selectedItemInPrev, ...filteredPrevData, ...filteredNewItems];
                  } else {
                    // Not in prevData or newItems - add formatted version at top
                    return [formattedSelectedVehicle, ...filteredPrevData, ...filteredNewItems];
                  }
                }
              }
              
              // No selected item - just append new items
              return [...prevData, ...newItems];
            });
            setVehicleBaseTotalRecords(response.total_records || 0);
            setVehiclePaginationLoading(false);
          }
          vehicleIsLoadingRef.current = false;
        })
        .catch(() => {
          if (isSearching) {
            setVehicleDropdownStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownId) || {};
              newMap.set(dropdownId, {
                ...currentState,
                paginationLoading: false,
              });
              return newMap;
            });
          } else {
            setVehiclePaginationLoading(false);
            setVehiclePage((prev) => prev - 1);
          }
          vehicleIsLoadingRef.current = false;
        });
    };
    
    return {
      data: processedData,
      normalizedSelectedItem: normalizedSelected || vehicleConfig.selectedItem,
      loading,
      paginationLoading,
      hasMore,
      onLoadMore: loadMoreForDropdown,
      onApiSearch: createVehicleApiSearchHandler(dropdownId),
      currentPage: isSearching ? (dropdownState.page || 1) : vehiclePage,
      searchQuery,
      totalRecords,
    };
  }, [vehicleConfig, vehicleDropdownStates, vehicleBaseData, vehicleBaseTotalRecords, vehicleFirstPageLoading, vehiclePaginationLoading, createVehicleApiSearchHandler, vehiclePage, vehicleSearch, vehicleAdditionalParamsRef, dropdown_limit, dispatch]);

  // Memoize the default handlers to prevent returning new objects on every render
  // This is crucial to prevent infinite loops in components using this hook
  const defaultDrivers = useMemo(() => {
    return driverConfig ? getDriverHandlers("default") : null;
  }, [getDriverHandlers, driverConfig]);

  const defaultVehicles = useMemo(() => {
    return vehicleConfig ? getVehicleHandlers("default") : null;
  }, [getVehicleHandlers, vehicleConfig]);

  // Return both the factory functions and default handlers for backward compatibility
  return {
    drivers: defaultDrivers,
    vehicles: defaultVehicles,
    // Factory functions to get handlers for specific dropdowns
    getDriverHandlers,
    getVehicleHandlers,
  };
};
