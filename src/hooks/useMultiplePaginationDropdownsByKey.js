import { useCallback, useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * Generic custom hook for managing multiple independent pagination dropdowns
 * Uses shared cache for initial data and separate state only for active searches
 * Only the actively searching dropdown makes API calls, others use shared cache
 *
 * @example
 * const { getPagination } = useMultiplePaginationDropdownsByKey({
 *   fetchAction: fetchDriverFilterDropdown,
 *   resetAction: resetDriverDropdown,
 *   limit: 30,
 *   additionalParams: { owner: "Admin Driver", is_drop_down: 1 },
 *   formatData: (data) => formatDropdownData("first_name", data, "last_name"),
 * });
 *
 * // Then use in component:
 * const driverPagination = getPagination("route_1_driver_0");
 *
 * <SearchablePaginatedDropdown
 *   data={driverPagination.data}
 *   loading={driverPagination.loading}
 *   onApiSearch={driverPagination.onApiSearch}
 *   hasMore={driverPagination.hasMore}
 *   onLoadMore={driverPagination.onLoadMore}
 *   paginationLoading={driverPagination.paginationLoading}
 *   // ... other props
 * />
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchAction - Redux async thunk action for fetching data
 * @param {Function} config.resetAction - Redux action to reset pagination data
 * @param {number} config.limit - Number of items per page (default: 30)
 * @param {Object} config.additionalParams - Additional parameters to pass to fetchAction
 * @param {Function} config.formatData - Optional function to format data (receives raw data array, returns formatted array)
 * @param {boolean} config.autoFetchInitial - Whether to auto-fetch initial data when hook is first used (default: true)
 * @param {Array} config.priorityItems - Optional array of items to add at top of dropdown (e.g., selected items from editData)
 * @param {Function} config.getPriorityItemsForDropdown - Optional function to get priority items for a specific dropdown key: (dropdownKey, selectedItem) => priorityItems[]
 *
 * @returns {Object} - Object containing getPagination function
 * @returns {Function} returns.getPagination - Function to get pagination handlers for a specific dropdown key
 */
export const useMultiplePaginationDropdownsByKey = ({
  fetchAction,
  resetAction,
  limit = 30,
  additionalParams = {},
  formatData = null, // Optional: (data) => formattedData
  autoFetchInitial = true,
  priorityItems = [], // Optional: static priority items
  getPriorityItemsForDropdown = null, // Optional: function to get priority items per dropdown
}) => {
  const dispatch = useDispatch();

  /**
   * Shared cache for initial/default data (empty search)
   * This cache is shared across all dropdowns to avoid duplicate API calls
   * Only one dropdown needs to fetch initial data, others use this cache
   * Structure: { data, totalRecords, currentPage, totalPages, loading, paginationLoading, hasMore }
   */
  const [sharedCache, setSharedCache] = useState({
    data: [],
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    loading: false,
    paginationLoading: false,
    hasMore: false,
  });

  /**
   * Map to store search state for actively searching dropdowns only
   * 
   * Key: dropdown identifier (e.g., "route_1_driver_0", "global_driver_2")
   * Value: { data, currentPage, searchQuery, loading, paginationLoading, hasMore, totalRecords, totalPages }
   * 
   * Only dropdowns with active search queries have entries here
   * When search is cleared, the entry is removed and dropdown falls back to sharedCache
   */
  const [searchStates, setSearchStates] = useState(new Map());

  /**
   * Track if shared cache has been initialized
   * Prevents duplicate initial fetches when multiple dropdowns are rendered
   */
  const sharedCacheInitializedRef = useRef(false);

  /**
   * Store additionalParams in ref to avoid deep comparison in dependencies
   * additionalParams may be an object that changes reference but not content
   * Using ref allows us to always access latest value without causing re-renders
   */
  const additionalParamsRef = useRef(additionalParams);

  /**
   * Update ref when additionalParams changes
   * Keeps ref in sync with latest additionalParams value
   */
  useEffect(() => {
    additionalParamsRef.current = additionalParams;
  }, [additionalParams]);

  /**
   * Cache for normalizedSelectedItem to prevent unnecessary re-renders
   * Key: `${dropdownKey}_${selectedItem._id}`
   * Value: Normalized/formatted selected item
   * 
   * Normalization includes formatting the item if formatData function is provided
   * Caching prevents re-formatting on every render
   */
  const normalizedSelectedItemCache = useRef(new Map());

  /**
   * Fetch shared cache (initial data with empty search)
   * 
   * This fetches the first page of data with empty search query
   * All dropdowns use this cache when not actively searching
   * 
   * @param {boolean} forceRefetch - If true, refetch even if already initialized
   */
  const fetchSharedCache = useCallback((forceRefetch = false) => {
    if (!forceRefetch && sharedCacheInitializedRef.current) return;

    sharedCacheInitializedRef.current = true;
    setSharedCache((prev) => {
      if (prev.loading) return prev; // Already loading
      return { ...prev, loading: true };
    });

    dispatch(resetAction());
    const currentAdditionalParams = additionalParamsRef.current;
    dispatch(
      fetchAction({
        page: 1,
        limit,
        search: "",
        ...currentAdditionalParams,
      })
    )
      .unwrap()
      .then((response) => {
        // Extract and format data
        const rawData = response?.result || [];
        const data = formatData ? formatData(rawData) : rawData;
        
        // Extract pagination metadata
        const totalRecords = response?.total_records || 0;
        const currentPage = response?.page_number || 1;
        const totalPages = response?.total_pages || 0;
        
        // Calculate hasMore: true if there are more pages or more records to load
        const hasMore = totalPages > 0 ? currentPage < totalPages : data.length < totalRecords;

        setSharedCache({
          data,
          totalRecords,
          currentPage,
          totalPages,
          loading: false,
          paginationLoading: false,
          hasMore,
        });
      })
      .catch(() => {
        setSharedCache((prev) => ({ ...prev, loading: false }));
        // sharedCacheInitializedRef.current = false;
      });
  }, [dispatch, limit, fetchAction, resetAction, formatData]);

  /**
   * Handle additionalParams changes - reset and refetch shared cache
   * 
   * When additionalParams change (e.g., vehicle_type_id changes),
   * we need to:
   * 1. Reset shared cache (old data is no longer valid)
   * 2. Clear all search states (they're based on old params)
   * 3. Refetch initial data with new params
   * 
   * Uses JSON.stringify for comparison to detect deep changes in object
   */
  useEffect(() => {
    const currentParamsStr = JSON.stringify(additionalParams);
    const prevParamsStr = JSON.stringify(additionalParamsRef.current);

    if (currentParamsStr !== prevParamsStr) {
      additionalParamsRef.current = additionalParams;
      // Reset shared cache and refetch with new params
      sharedCacheInitializedRef.current = false;
      setSearchStates(new Map()); // Clear all search states (old searches invalid)
      fetchSharedCache(true); // Force refetch with new params
    }
  }, [additionalParams, fetchSharedCache]);

  /**
   * Handle API search for a specific dropdown
   * 
   * When user types in a dropdown search box:
   * 1. If search is empty: Remove from searchStates (use sharedCache)
   * 2. If search has value: Create/update search state for this dropdown
   * 3. Fetch first page of search results
   * 
   * Each dropdown maintains its own search state independently
   * 
   * @param {string} dropdownKey - Unique identifier for the dropdown
   * @param {string} searchValue - Search query from user input
   */
  const handleApiSearch = useCallback(
    (dropdownKey, searchValue) => {
      const trimmedSearch = searchValue?.trim() || "";
      const isSearching = trimmedSearch.length > 0;

      /**
       * If search is cleared (empty), remove search state and use shared cache
       * This allows dropdown to fall back to shared cache when user clears search
       */
      if (!isSearching) {
        setSearchStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(dropdownKey);
          return newMap;
        });
        return;
      }

      /**
       * Initialize or update search state for this dropdown
       * Creates a new entry in searchStates Map for this specific dropdown
       * This dropdown will now use its own search results instead of sharedCache
       */
      setSearchStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(dropdownKey, {
          data: [],
          currentPage: 1,
          searchQuery: trimmedSearch,
          loading: true,
          paginationLoading: false,
          hasMore: false,
          totalRecords: 0,
        });
        return newMap;
      });

      dispatch(resetAction());
      const currentAdditionalParams = additionalParamsRef.current;
      dispatch(
        fetchAction({
          page: 1,
          limit,
          search: trimmedSearch,
          ...currentAdditionalParams,
        })
      )
        .unwrap()
        .then((response) => {
          const rawData = response?.result || [];
          const data = formatData ? formatData(rawData) : rawData;
          const totalRecords = response?.total_records || 0;
          const currentPage = response?.page_number || 1;
          const totalPages = response?.total_pages || 0;
          const hasMore = totalPages > 0 ? currentPage < totalPages : data.length < totalRecords;

          setSearchStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(dropdownKey) || {};
            newMap.set(dropdownKey, {
              ...currentState,
              data,
              loading: false,
              hasMore,
              totalRecords,
              currentPage,
              totalPages,
            });
            return newMap;
          });
        })
        .catch(() => {
          setSearchStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(dropdownKey) || {};
            newMap.set(dropdownKey, { ...currentState, loading: false });
            return newMap;
          });
        });
    },
    [dispatch, limit, fetchAction, resetAction, formatData]
  );

  // handleApiSearch callback is stable (dependencies are stable)

  /**
   * Handle load more for a specific dropdown
   * 
   * Loads the next page of data for a dropdown:
   * - If dropdown is actively searching: Loads next page of search results
   * - If dropdown is not searching: Loads next page from shared cache
   * 
   * Prevents duplicate loads by checking paginationLoading and hasMore flags
   * 
   * @param {string} dropdownKey - Unique identifier for the dropdown
   */
  const handleLoadMore = useCallback(
    (dropdownKey) => {
      const searchState = searchStates.get(dropdownKey);

      if (searchState) {
        /**
         * Loading more for active search
         * This dropdown has an active search query, so load next page of search results
         */
        // Prevent duplicate loads
        if (searchState.paginationLoading || !searchState.hasMore) return;

        const nextPage = searchState.currentPage + 1;

        // Set loading state
        setSearchStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(dropdownKey) || {};
          newMap.set(dropdownKey, { ...currentState, paginationLoading: true });
          return newMap;
        });

        // Fetch next page with current search query
        const currentAdditionalParams = additionalParamsRef.current;
        dispatch(
          fetchAction({
            page: nextPage,
            limit,
            search: searchState.searchQuery, // Use the search query for this dropdown
            ...currentAdditionalParams,
          })
        )
          .unwrap()
          .then((response) => {
            // Extract and format new page data
            const rawData = response?.result || [];
            const formattedData = formatData ? formatData(rawData) : rawData;
            const totalRecords = response?.total_records || 0;
            const currentPage = response?.page_number || nextPage;
            const totalPages = response?.total_pages || 0;

            // Append new data to existing search results
            setSearchStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownKey) || {};
              const updatedData = [...currentState.data, ...formattedData]; // Append to existing
              const hasMore = totalPages > 0 ? currentPage < totalPages : updatedData.length < totalRecords;

              newMap.set(dropdownKey, {
                ...currentState,
                data: updatedData,
                currentPage,
                totalPages,
                paginationLoading: false,
                hasMore,
              });
              return newMap;
            });
          })
          .catch(() => {
            setSearchStates((prev) => {
              const newMap = new Map(prev);
              const currentState = newMap.get(dropdownKey) || {};
              newMap.set(dropdownKey, { ...currentState, paginationLoading: false });
              return newMap;
            });
          });
      } else {
        /**
         * Loading more for shared cache (not searching)
         * This dropdown is not actively searching, so load next page from shared cache
         * All non-searching dropdowns benefit from this shared cache update
         */
        if (sharedCache.paginationLoading || !sharedCache.hasMore) return;

        const nextPage = sharedCache.currentPage + 1;

        // Set loading state for shared cache
        setSharedCache((prev) => ({ ...prev, paginationLoading: true }));

        // Fetch next page with empty search (shared cache)
        const currentAdditionalParams = additionalParamsRef.current;
        dispatch(
          fetchAction({
            page: nextPage,
            limit,
            search: "", // Empty search for shared cache
            ...currentAdditionalParams,
          })
        )
          .unwrap()
          .then((response) => {
            // Extract and format new page data
            const rawData = response?.result || [];
            const formattedData = formatData ? formatData(rawData) : rawData;
            const totalRecords = response?.total_records || 0;
            const currentPage = response?.page_number || nextPage;
            const totalPages = response?.total_pages || 0;

            // Append new data to shared cache (all non-searching dropdowns benefit)
            setSharedCache((prev) => {
              const updatedData = [...prev.data, ...formattedData]; // Append to existing
              const hasMore = totalPages > 0 ? currentPage < totalPages : updatedData.length < totalRecords;
              return {
                ...prev,
                data: updatedData,
                totalRecords,
                currentPage,
                totalPages,
                paginationLoading: false,
                hasMore,
              };
            });
          })
          .catch(() => {
            setSharedCache((prev) => ({ ...prev, paginationLoading: false }));
          });
      }
    },
    [dispatch, limit, searchStates, sharedCache, fetchAction, formatData]
  );

  // handleLoadMore callback is stable (dependencies are stable)

  /**
   * Helper function to merge priority items with base data
   * 
   * Priority items are items that should appear at the top of the dropdown:
   * 1. Static priority items (from priorityItems prop)
   * 2. Dynamic priority items (from getPriorityItemsForDropdown function)
   * 3. Selected item (if not already in priority items)
   * 
   * Logic:
   * - Formats priority items if formatData function is provided
   * - Removes duplicates from base data (items already in priority)
   * - Returns: [selected item, priority items, base data]
   * 
   * Note: Priority items are NOT shown when actively searching (only in initial/default view)
   * 
   * @param {Array} baseData - Base data from API (shared cache or search results)
   * @param {string} dropdownKey - Unique identifier for the dropdown
   * @param {Object} selectedItem - Currently selected item for this dropdown
   * @returns {Array} Combined array with priority items at top
   */
  const mergePriorityItems = useCallback(
    (baseData, dropdownKey, selectedItem) => {
      if (!baseData || !Array.isArray(baseData)) return baseData;

      // Get priority items for this dropdown
      let itemsToAdd = [];

      /**
       * Get static priority items (same for all dropdowns)
       * Example: All drivers/vehicles from existing routes in edit case
       */
      if (priorityItems && priorityItems.length > 0) {
        // Filter out invalid items (must have _id)
        const validStaticItems = priorityItems.filter(item => item && item._id);
        itemsToAdd = [...validStaticItems];
      }

      /**
       * Get dynamic priority items from function (different per dropdown)
       * Example: Currently selected driver/vehicle for this specific dropdown
       */
      if (getPriorityItemsForDropdown) {
        const dynamicItems = getPriorityItemsForDropdown(dropdownKey, selectedItem);
        if (dynamicItems && Array.isArray(dynamicItems)) {
          // Filter out invalid items before adding
          const validDynamicItems = dynamicItems.filter(item => item && item._id);
          itemsToAdd = [...itemsToAdd, ...validDynamicItems];
        }
      }

      // If no priority items, return base data as-is
      if (itemsToAdd.length === 0) return baseData;

      /**
       * Format priority items if formatData function is provided
       * Ensures priority items have same format as base data
       */
      const formattedPriorityItems = formatData
        ? formatData(itemsToAdd)
        : itemsToAdd;

      /**
       * Get all priority item IDs to filter out from base data
       * Prevents duplicates: priority items should not appear twice
       */
      const priorityIds = new Set();
      formattedPriorityItems.forEach((item) => {
        if (item && item._id) priorityIds.add(item._id);
      });
      // Add selected item ID to filter set (selected item should not appear in base data)
      if (selectedItem && selectedItem._id) {
        priorityIds.add(selectedItem._id);
      }

      /**
       * Filter out priority items from base data to avoid duplicates
       * Base data should not contain items that are already in priority section
       */
      const filteredBaseData = baseData.filter(
        (item) => item && item._id && !priorityIds.has(item._id)
      );

      /**
       * Add selected item at top if not already in priority items
       * Selected item should always be visible, even if not in API results
       */
      const itemsAtTop = [];
      if (selectedItem?._id) {
        const selectedInPriority = formattedPriorityItems.some(
          (item) => item && item._id === selectedItem._id
        );
        if (!selectedInPriority) {
          // Format selected item to match data format
          const formattedSelected = formatData
            ? formatData([selectedItem])[0]
            : selectedItem;
          if (formattedSelected && formattedSelected._id) itemsAtTop.push(formattedSelected);
        }
      }

      // Filter out any empty/invalid priority items
      const validPriorityItems = formattedPriorityItems.filter(
        (item) => item && item._id
      );

      // Filter out any empty/invalid items at top
      const validItemsAtTop = itemsAtTop.filter(
        (item) => item && item._id
      );

      /**
       * Combine: selected item (if not in priority) + priority items + filtered base data
       * Order: [selected, priority items, base data]
       */
      return [
        ...validItemsAtTop,
        ...validPriorityItems,
        ...filteredBaseData,
      ];
    },
    [priorityItems, getPriorityItemsForDropdown, formatData]
  );

  // mergePriorityItems callback is stable (uses refs, no dependencies)

  /**
   * Get pagination handlers for a specific dropdown
   * 
   * This is the main function that components call to get dropdown data and handlers
   * 
   * Returns:
   * - data: Array of items to display (with priority items at top if not searching)
   * - loading: Initial loading state
   * - paginationLoading: Loading more pages state
   * - hasMore: Whether more pages are available
   * - normalizedSelectedItem: Formatted selected item (cached for performance)
   * - onApiSearch: Function to handle search input
   * - onLoadMore: Function to load next page
   * 
   * @param {string} dropdownKey - Unique identifier for the dropdown (e.g., "route_1_driver_0")
   * @param {Object} selectedItem - Currently selected item for this dropdown
   * @returns {Object} Pagination handlers and data for the dropdown
   */
  const getPagination = useCallback(
    (dropdownKey, selectedItem = null) => {
      /**
       * Check if this dropdown has active search state
       * If searchState exists, dropdown is actively searching (has search query)
       * Otherwise, dropdown uses shared cache (no search query)
       */
      const searchState = searchStates.get(dropdownKey);
      const isSearching = searchState !== undefined;

      /**
       * Trigger initial shared cache fetch if not already initialized
       * This auto-fetches initial data when first dropdown is rendered
       * Only runs once (sharedCacheInitializedRef prevents duplicates)
       */
      if (
        autoFetchInitial &&
        !sharedCacheInitializedRef.current &&
        !sharedCache.loading &&
        sharedCache.data.length === 0
      ) {
        fetchSharedCache();
      }

      /**
       * Determine which data source to use
       * - If searching: Use search state data (specific to this dropdown)
       * - If not searching: Use shared cache data (shared across all non-searching dropdowns)
       */
      let data, loading, paginationLoading, hasMore;

      if (isSearching) {
        // Use search state data (actively searching - dropdown has its own search results)
        data = searchState.data;
        loading = searchState.loading;
        paginationLoading = searchState.paginationLoading;
        hasMore = searchState.hasMore;
      } else {
        // Use shared cache data (not searching - all non-searching dropdowns share this)
        data = sharedCache.data;
        loading = sharedCache.loading;
        paginationLoading = sharedCache.paginationLoading;
        hasMore = sharedCache.hasMore;
      }

      /**
       * Merge priority items with data (only when not searching)
       * Priority items are NOT shown in search results (only in initial/default view)
       * This ensures search results are clean and relevant
       */
      const finalData = isSearching
        ? data
        : mergePriorityItems(data, dropdownKey, selectedItem);

      /**
       * Normalize selected item
       * 
       * Normalization includes:
       * 1. Finding item in finalData (if exists, use that - it's already formatted)
       * 2. If not found, format it using formatData function
       * 3. Cache the normalized item to prevent re-formatting on every render
       * 
       * This ensures selected item always has correct format and is cached for performance
       */
      let normalizedSelectedItem = null;
      if (selectedItem && selectedItem._id) {
        const selectedId = selectedItem._id;
        const cacheKey = `${dropdownKey}_${selectedId}`;

        // Check cache first (performance optimization)
        let cachedItem = normalizedSelectedItemCache.current.get(cacheKey);
        if (cachedItem) {
          /**
           * Verify cached item still exists in finalData
           * If item was removed from data, cache is stale and should be cleared
           */
          const stillExists = finalData.some(
            (item) => item?._id && item._id === selectedId
          );
          if (!stillExists) {
            // Remove from cache if not found (stale cache)
            normalizedSelectedItemCache.current.delete(cacheKey);
            cachedItem = null;
          }
        }

        if (cachedItem) {
          // Use cached normalized item (performance optimization)
          normalizedSelectedItem = cachedItem;
        } else {
          /**
           * Try to find selected item in finalData
           * If found, use it (it's already formatted and in correct format)
           */
          const foundItem = finalData.find(
            (item) => item?._id && item._id === selectedId
          );

          if (foundItem) {
            normalizedSelectedItem = foundItem;
          } else {
            /**
             * If not found in finalData, format it and use formatted version
             * This handles case where selected item is not in API results
             * (e.g., item was deleted but still selected)
             */
            const formattedSelected = formatData
              ? formatData([selectedItem])[0]
              : selectedItem;
            normalizedSelectedItem = formattedSelected || selectedItem;
          }

          // Cache it for future renders (performance optimization)
          normalizedSelectedItemCache.current.set(cacheKey, normalizedSelectedItem);
        }
      }

      return {
        data: finalData,
        loading,
        paginationLoading,
        hasMore,
        normalizedSelectedItem,
        onApiSearch: (searchValue) => handleApiSearch(dropdownKey, searchValue),
        onLoadMore: () => handleLoadMore(dropdownKey),
      };
    },
    [
      searchStates,
      sharedCache,
      autoFetchInitial,
      fetchSharedCache,
      mergePriorityItems,
      handleApiSearch,
      handleLoadMore,
      formatData
    ]
  );

  // getPagination callback is stable (dependencies are stable)

  return { getPagination };
};

