import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Generic custom hook for pagination dropdown functionality
 * Reduces boilerplate code by encapsulating all pagination logic
 * 
 * @example
 * // Basic usage (no additional params)
 * const countriesPagination = usePaginationDropdown({
 *   fetchAction: fetchCountriesDropdown,
 *   resetAction: resetCountriesDropdown,
 *   dataSelector: showCountriesData,
 *   limit: 30,
 * });
 * 
 * // Usage with additional params (e.g., country_id for cities)
 * const citiesPagination = usePaginationDropdown({
 *   fetchAction: fetchCitiesDropdown,
 *   resetAction: resetCitiesDropdown,
 *   dataSelector: showCitiesData,
 *   limit: 30,
 *   additionalParams: { country_id: selectedCountry?._id },
 * });
 * 
 * // Then use in SearchDropdown:
 * <SearchDropdown
 *   data={countriesPagination.data}
 *   loading={countriesPagination.loading}
 *   enableApiSearch={true}
 *   onApiSearch={countriesPagination.onApiSearch}
 *   hasMore={countriesPagination.hasMore}
 *   onLoadMore={countriesPagination.onLoadMore}
 *   paginationLoading={countriesPagination.paginationLoading}
 *   debounceTime={500}
 *   // ... other props
 * />
 * 
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchAction - Redux async thunk action for fetching data
 * @param {Function} config.resetAction - Redux action to reset pagination data in store
 * @param {Function} config.dataSelector - Redux selector for paginated data
 * @param {number} config.limit - Number of items per page (default: 30)
 * @param {Object} config.additionalParams - Additional parameters to pass to fetchAction (e.g., country_id). When these change, data is automatically refetched.
 * @param {Object} config.selectedItem - Optional selected item to prioritize at top of list and normalize for proper selection highlighting
 * 
 * @returns {Object} - Object containing all necessary props and handlers for SearchDropdown
 * @returns {Array} returns.data - Array of data items for dropdown (with selected item at top if not searching)
 * @returns {Object} returns.normalizedSelectedItem - Normalized selected item for proper selection highlighting (matches list item format)
 * @returns {boolean} returns.loading - First page loading state
 * @returns {boolean} returns.paginationLoading - Pagination loading state
 * @returns {boolean} returns.hasMore - Whether more data is available
 * @returns {Function} returns.onLoadMore - Function to load more data
 * @returns {Function} returns.onApiSearch - Function to handle API search
 * @returns {number} returns.currentPage - Current page number
 * @returns {string} returns.searchQuery - Current search query
 * @returns {number} returns.totalRecords - Total number of records
 */
export const usePaginationDropdown = ({
  fetchAction,
  resetAction,
  dataSelector,
  limit = 30,
  additionalParams = {},
  selectedItem = null,
}) => {
  const dispatch = useDispatch();

  // Local state for pagination (no longer in Redux)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [firstPageLoading, setFirstPageLoading] = useState(false);

  // Select only data from Redux
  const data = useSelector(dataSelector);

  // Track previous additionalParams to detect changes
  const prevAdditionalParamsRef = useRef(additionalParams);
  const isFirstMount = useRef(true);
  
  // Use refs to track values for callbacks (avoid dependency issues)
  const currentPageRef = useRef(1);
  const searchQueryRef = useRef("");
  const additionalParamsRef = useRef(additionalParams);
  const isLoadingRef = useRef(false); // Guard to prevent multiple simultaneous calls

  // Keep refs in sync with state
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    additionalParamsRef.current = additionalParams;
  }, [additionalParams]);

  // Handle additionalParams changes (e.g., country_id for cities)
  // When additionalParams change, reset and refetch data
  useEffect(() => {
    // Skip initial mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevAdditionalParamsRef.current = additionalParams;
      return;
    }

    // Check if additionalParams actually changed
    const paramsChanged = JSON.stringify(prevAdditionalParamsRef.current) !== JSON.stringify(additionalParams);
    
    if (paramsChanged) {
      prevAdditionalParamsRef.current = additionalParams;
      
      // Always refetch when additionalParams change, even if params are empty/invalid
      // The fetchAction wrapper (e.g., fetchCustomerWithAgency) can handle empty params correctly
      setCurrentPage(1);
      currentPageRef.current = 1;
      setSearchQuery("");
      searchQueryRef.current = "";
      setFirstPageLoading(true);
      isLoadingRef.current = true;
      dispatch(resetAction());
      dispatch(
        fetchAction({
          page: 1,
          limit,
          search: "",
          ...additionalParams,
        })
      )
        .unwrap()
        .then(() => {
          setFirstPageLoading(false);
          isLoadingRef.current = false;
        })
        .catch(() => {
          setFirstPageLoading(false);
          isLoadingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(additionalParams)]);

  /**
   * API search handler - called when user searches in SearchDropdown
   * Resets the list and fetches matching results from API
   */
  const handleApiSearch = useCallback(
    (searchValue) => {
      // Reset local state
      setCurrentPage(1);
      currentPageRef.current = 1;
      setSearchQuery(searchValue);
      searchQueryRef.current = searchValue;
      setFirstPageLoading(true);
      setPaginationLoading(true);
      isLoadingRef.current = true;
      
      // Reset Redux data
      dispatch(resetAction());
      
      // Fetch new data
      dispatch(
        fetchAction({
          page: 1,
          limit,
          search: searchValue,
          ...additionalParamsRef.current,
        })
      )
        .unwrap()
        .then(() => {
          setFirstPageLoading(false);
          setPaginationLoading(false);
          isLoadingRef.current = false;
        })
        .catch(() => {
          setFirstPageLoading(false);
          setPaginationLoading(false);
          isLoadingRef.current = false;
        });
    },
    [
      dispatch,
      resetAction,
      fetchAction,
      limit,
    ]
  );

  /**
   * Loads more data for infinite scroll pagination
   * Called when user scrolls to bottom of SearchDropdown list
   */
  const loadMore = useCallback(() => {
    // Guard: Prevent multiple simultaneous calls
    if (isLoadingRef.current || paginationLoading) {
      return;
    }

    // Check if more data is available
    if (data?.result?.length >= data?.total_records) {
      return;
    }

    const nextPage = currentPageRef.current + 1;
    isLoadingRef.current = true;
    setCurrentPage(nextPage);
    setPaginationLoading(true);
    
    dispatch(
      fetchAction({
        page: nextPage,
        limit,
        search: searchQueryRef.current,
        ...additionalParamsRef.current,
      })
    )
      .unwrap()
      .then(() => {
        setPaginationLoading(false);
        isLoadingRef.current = false;
      })
      .catch(() => {
        setPaginationLoading(false);
        isLoadingRef.current = false;
        // Revert page on error
        setCurrentPage(currentPageRef.current - 1);
      });
  }, [
    dispatch,
    fetchAction,
    limit,
    paginationLoading,
    data,
  ]);

  /**
   * Checks if more data is available to load
   * Used by SearchDropdown to determine if infinite scroll should show "Load More"
   */
  const hasMore = useMemo(() => {
    return data?.result?.length < data?.total_records;
  }, [data]);

  /**
   * Process data to prioritize selected item at top and normalize selected item
   * This ensures selected item is always visible and properly highlighted
   */
  const { processedData, normalizedSelectedItem } = useMemo(() => {
    const dataList = data?.result || [];

    // If no selected item, return data as-is
    if (!selectedItem || !selectedItem._id) {
      return {
        processedData: dataList,
        normalizedSelectedItem: selectedItem,
      };
    }

    // Only prioritize when NOT searching (to avoid showing selected item in search results)
    if (!searchQuery || searchQuery.trim() === "") {
      const priorityId = String(selectedItem._id);
      
      // Check if selected item is already in the list
      const itemInList = dataList.find(
        (item) => String(item._id) === priorityId
      );

      let priorityItem = selectedItem;
      let normalizedSelected = null;

      // Use the one from list if available (to ensure proper formatting and selection highlighting)
      // Otherwise normalize the selected item
      if (itemInList) {
        priorityItem = itemInList;
        normalizedSelected = itemInList; // Use list item for selected prop
      } else {
        // Item not in list, normalize it
        priorityItem = {
          ...selectedItem,
          _id: String(selectedItem._id),
        };
        normalizedSelected = priorityItem; // Use normalized version for selected prop
      }

      // Always filter out priority item from the main list to avoid duplicates
      // and always put it at the top
      const filteredList = dataList.filter(
        (item) => String(item._id) !== priorityId
      );

      return {
        processedData: [priorityItem, ...filteredList],
        normalizedSelectedItem: normalizedSelected,
      };
    }

    // If searching, normalize selected item for proper highlighting but don't prioritize
    const priorityId = String(selectedItem._id);
    const itemInList = dataList.find(
      (item) => String(item._id) === priorityId
    );
    const normalizedSelected = itemInList || {
      ...selectedItem,
      _id: String(selectedItem._id),
    };

    return {
      processedData: dataList,
      normalizedSelectedItem: normalizedSelected,
    };
  }, [data?.result, selectedItem, searchQuery]);

  // Reset function that can be called externally if needed
  const reset = useCallback(() => {
    setCurrentPage(1);
    currentPageRef.current = 1;
    setSearchQuery("");
    searchQueryRef.current = "";
    setPaginationLoading(false);
    setFirstPageLoading(false);
    isLoadingRef.current = false;
    dispatch(resetAction());
  }, [dispatch, resetAction]);

  return {
    // Data for SearchDropdown (with selected item at top if not searching)
    data: processedData,
    
    // Normalized selected item for proper selection highlighting
    normalizedSelectedItem: normalizedSelectedItem || selectedItem,
    
    // Loading states
    loading: firstPageLoading,
    paginationLoading,
    
    // Pagination props for SearchDropdown
    hasMore,
    onLoadMore: loadMore,
    
    // API search props for SearchDropdown
    onApiSearch: handleApiSearch,
    
    // Additional state that might be useful
    currentPage,
    searchQuery,
    totalRecords: data?.total_records || 0,
    reset, // Expose reset function if needed
  };
};

