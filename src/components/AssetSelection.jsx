import React, { useState, useMemo, useRef, useCallback } from "react";
import Button from "./Button";
import Checkboxes from "./Checkboxes";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { List, AutoSizer } from "react-virtualized";
import SearchInput from "./SearchInput";
import { debounce } from "global/helper";
import { useTranslation } from "react-i18next";

/**
 * AssetRow Component - Renders a single asset row in the left panel list
 * Memoized for performance optimization to prevent unnecessary re-renders
 * Used with react-virtualized List component for efficient rendering
 */
const AssetRow = React.memo(({ index, style, data }) => {
  const { items, internalValue, handleAssetToggle, singleSelection } = data;
  const asset = items[index];
  const isSelected = internalValue.includes(asset.id);

  return (
    <div style={style} className="pr-4">
      <div
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
        onClick={() => handleAssetToggle(asset.id)}
      >
        {/* Conditional rendering based on selection mode */}
        {singleSelection ? (
          // Radio button style for single selection mode
          <div
            className={`flex items-center justify-center size-5 border-2 rounded-full flex-shrink-0 ${
              isSelected ? "border-blue-600" : "border-[#E2E8F0]"
            }`}
          >
            {/* Inner dot indicator when selected */}
            {isSelected && (
              <div className="size-3 rounded-full bg-blue-600"></div>
            )}
          </div>
        ) : (
          // Checkbox component for multiple selection mode
          <Checkboxes
            enabled={isSelected}
            onChange={() => handleAssetToggle(asset.id)}
          />
        )}
        {/* Asset value/name display */}
        <div className="flex-1">
          <div className="font-medium max-w-[90%] truncate">{asset.value}</div>
        </div>
      </div>
    </div>
  );
});

AssetRow.displayName = "AssetRow";

/**
 * SelectedAssetRow Component - Renders a selected asset in the right panel
 * Memoized for performance optimization
 * Displays selected assets with a remove button
 */
const SelectedAssetRow = React.memo(({ index, style, data }) => {
  const { items, handleRemoveAsset } = data;
  const asset = items[index];

  return (
    <div style={style} className="px-4 ">
      <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
        <div className="flex-1 min-w-0">
          <div className="font-medium max-w-[90%] truncate">{asset.value}</div>
        </div>
        <Button
          onClick={() => handleRemoveAsset(asset.id)}
          className="!h-8 !w-8 !p-0 hover:bg-red-100 hover:text-red-600"
          icon={FaTimes}
          //   iconClass="h-3 !w-full"
        />
      </div>
    </div>
  );
});

SelectedAssetRow.displayName = "SelectedAssetRow";

/**
 * AssetSelection Component - Main component for selecting assets (vehicles, drivers, etc.)
 * Features:
 * - Single or multiple selection modes
 * - Search functionality (local or API-based)
 * - Infinite scroll pagination
 * - Virtualized lists for performance
 * - Preserves selected items during search/filtering
 */
export function AssetSelection({
  exportFilter,
  initialValue = [], // Initially selected asset IDs
  onApply, // Callback function when apply button is clicked
  options, // Array of available asset options
  searchQuery, // Current search query string
  onSearchChange, // Callback when search query changes
  onClose, // Callback to close the selection modal/popup
  generateDates, // Optional function to generate dates for selected assets
  isLoading = false, // Loading state for initial data fetch
  placeholder, // Placeholder text when no assets found
  selectedPlaceholder, // Placeholder text when no assets selected
  singleSelection = false, // If true, allows only single selection (radio), else multiple (checkbox)
  // Pagination props
  hasMore = false, // Flag indicating if more data is available to load
  onLoadMore, // Callback function to load more data (infinite scroll)
  paginationLoading = false, // Loading state during pagination
  totalRecords = 0, // Total number of records available
  // API search props
  enableApiSearch = false, // If true, uses API search instead of local filtering
  onApiSearch, // Callback function for API-based search
  debounceTime = 500, // Debounce delay for API search (in milliseconds)
  assetName, // Name of the asset type (e.g., "vehicle", "driver") for display
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const displayPlaceholder = placeholder ?? t("assetSelection:no_assets_found");
  const displaySelectedPlaceholder =
    selectedPlaceholder ?? t("assetSelection:no_assets_selected");
  // State management
  const [internalValue, setInternalValue] = useState(initialValue); // Array of selected asset IDs
  const [loading, setLoading] = useState(false); // Loading state for apply operation
  // Refs for maintaining references
  const debouncedSearchQuery = searchQuery; // Current search query (can be debounced)
  const listRef = useRef(null); // Reference to the virtualized list component
  const scrollPositionRef = useRef(0); // Reference to track scroll position

  /**
   * Debounced API search function
   * Delays API calls to prevent excessive requests while user is typing
   * Only triggers API search after user stops typing for the specified debounce time
   */
  const debouncedApiSearch = useCallback(
    debounce((value) => {
      if (onApiSearch) onApiSearch(value);
    }, debounceTime),
    [onApiSearch, debounceTime]
  );

  /**
   * Filtered options based on search query
   * - If API search is enabled, uses data directly from API (already filtered by backend)
   * - If API search is disabled, performs local filtering on options array
   * Note: We don't reorder by selection here to avoid list jumping while selecting
   * The parent component (BasicDetails) ensures selected items are at top of options array
   */
  const filteredOptions = useMemo(() => {
    // If API search is enabled, use data from API directly (already filtered by backend)
    if (enableApiSearch) {
      return options;
    }

    // Local filtering: only when API search is disabled
    // If no search query, return all options
    if (!debouncedSearchQuery) {
      return options;
    }

    // Apply local search filter
    const searchLower = debouncedSearchQuery.toLowerCase().trim();
    return options.filter((option) => {
      const valueLower = option.value.toLowerCase().trim();
      const idLower = String(option.id).toLowerCase().trim();
      return valueLower.includes(searchLower) || idLower.includes(searchLower);
    });
  }, [options, debouncedSearchQuery, enableApiSearch]);

  /**
   * Reference to preserve selected assets during search/filtering operations
   * This ensures selected items remain visible even when they're not in the current filtered results
   */
  const preservedSelectedAssetsRef = useRef([]);

  /**
   * Selected assets - merges preserved assets with current options
   * This ensures selected items are always available even when filtered out of the main list
   * Important for maintaining selection state during search operations
   */
  const selectedAssets = useMemo(() => {
    // Get selections from current options
    const currentSelected = options.filter((option) =>
      internalValue.includes(option.id)
    );

    // Merge: add new selections to preserved, keep existing preserved ones that are still selected
    // Start with preserved selections
    const mergedSelections = [...preservedSelectedAssetsRef.current];
    // Add any new selections from current options that aren't already preserved
    currentSelected.forEach((asset) => {
      if (!mergedSelections.some((p) => p.id === asset.id)) {
        mergedSelections.push(asset);
      }
    });

    // Update preserved ref with merged selections
    preservedSelectedAssetsRef.current = mergedSelections;

    // Return only those that are currently in internalValue (selected)
    return mergedSelections.filter((asset) => internalValue.includes(asset.id));
  }, [options, internalValue]);

  /**
   * Handle asset toggle - adds or removes asset from selection
   * Supports both single and multiple selection modes
   */
  const handleAssetToggle = (assetId) => {
    if (singleSelection) {
      // Single selection mode: replace selection (radio button behavior)
      // If already selected, deselect; otherwise, select this asset
      const newValue = internalValue.includes(assetId) ? [] : [assetId];
      setInternalValue(newValue);
    } else {
      // Multiple selection mode: toggle selection (checkbox behavior)
      // If already selected, remove it; otherwise, add it
      const newValue = internalValue.includes(assetId)
        ? internalValue.filter((id) => id !== assetId)
        : [...internalValue, assetId];
      setInternalValue(newValue);

      // If adding a new asset, also add it to preserved ref from current options
      // This ensures the asset remains available even if filtered out later
      if (!internalValue.includes(assetId)) {
        const assetToAdd = options.find((o) => o.id === assetId);
        if (
          assetToAdd &&
          !preservedSelectedAssetsRef.current.some((p) => p.id === assetId)
        ) {
          preservedSelectedAssetsRef.current.push(assetToAdd);
        }
      }
    }
  };

  /**
   * Handle remove asset - removes a specific asset from selection
   * Called when user clicks the remove button in the selected assets panel
   */
  const handleRemoveAsset = (assetId) => {
    const newValue = internalValue.filter((id) => id !== assetId);
    setInternalValue(newValue);
  };

  const handleClearAll = () => setInternalValue([]);
  // const handleSelectAll = () => {
  //   const allIds = filteredOptions.map((option) => option.id);
  //   setInternalValue(allIds);
  // };

  /**
   * Handle search input change
   * Updates the search query and triggers API search if enabled
   */
  const handleSearchChange = (value) => {
    onSearchChange(value);
    if (enableApiSearch && onApiSearch) {
      debouncedApiSearch(value);
    }
  };

  /**
   * Handle scroll for infinite pagination
   * Detects when user scrolls near the bottom and triggers loading more data
   */
  const handleScroll = ({ scrollTop, clientHeight, scrollHeight }) => {
    scrollPositionRef.current = scrollTop;
    // Trigger pagination when user is within 50px of the bottom
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      // Only load more if there's more data available and not already loading
      if (hasMore && !paginationLoading && onLoadMore) {
        onLoadMore();
      }
    }
  };

  //   const handleApply = async () => {
  //     setLoading(true);
  //     if (exportFilter || !generateDates) {
  //       onApply(internalValue);
  //       onClose?.();
  //       return;
  //     }
  //     try {
  //       if (generateDates) {
  //         await generateDates(
  //           internalValue,
  //           () => {
  //             onApply(internalValue);
  //             onClose?.();
  //             console.log("Dates generated successfully from popup");
  //           },
  //           (error) => console.error("Error generating dates from popup:", error)
  //         );
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  /**
   * Handle apply button click
   * Applies the selected assets and optionally generates dates
   * Uses setTimeout to allow UI to render before executing async operations
   */
  const handleApply = async () => {
    setLoading(true);

    // Give UI a render cycle to update loading state
    // This ensures the loading indicator is visible before async operations
    setTimeout(async () => {
      // If export filter or no date generation needed, apply immediately
      if (exportFilter || !generateDates) {
        // Pass both IDs and full asset objects to parent component
        onApply(internalValue, selectedAssets);
        onClose?.();
        setLoading(false);
        return;
      }

      // If date generation is required, generate dates first
      try {
        if (generateDates) {
          await generateDates(
            internalValue,
            () => {
              // Success callback: apply selections with full asset objects
              onApply(internalValue, selectedAssets);
              onClose?.();
              console.log("Dates generated successfully from popup");
            },
            (error) =>
              console.error("Error generating dates from popup:", error)
          );
        }
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  return (
    <div>
      <div className="flex h-[500px]">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col ltr:border-r rtl:border-l border-gray-200">
          {/* Search */}
          <div className="py-4 ltr:pr-4 rtl:pl-4 border-b">
            <div className="flex gap-2">
              <div className="relative flex-1 z-[99999999]">
                <SearchInput
                  placeholder={t("search_placeholder", {
                    name: assetName,
                  })}
                  initialValue={searchQuery}
                  onSearch={handleSearchChange}
                  inputClass="!h-[42px]"
                />
              </div>
              {/* {!singleSelection && (
                <Button
                  btn="outline"
                  onClick={handleSelectAll}
                  className="text-xs"
                  title="Select All"
                />
              )} */}
            </div>
          </div>

          {/* Asset List */}
          <div className="flex-1 pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <FaSpinner className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {displayPlaceholder}
              </div>
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    ref={listRef}
                    height={height}
                    rowCount={
                      filteredOptions.length + (paginationLoading ? 1 : 0)
                    }
                    rowHeight={42}
                    width={width}
                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                    onScroll={handleScroll}
                    rowRenderer={({ index, key, style }) => {
                      // Show loader as last row during pagination
                      if (
                        index === filteredOptions.length &&
                        paginationLoading
                      ) {
                        return (
                          <div
                            key={key}
                            style={style}
                            className="flex justify-center items-center"
                          >
                            <FaSpinner className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        );
                      }
                      return (
                        <AssetRow
                          key={key}
                          index={index}
                          style={style}
                          data={{
                            items: filteredOptions,
                            internalValue,
                            handleAssetToggle,
                            singleSelection,
                          }}
                        />
                      );
                    }}
                  />
                )}
              </AutoSizer>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col">
          <div className="p-4 border-b flex gap-2 items-center justify-between min-h-[73px]">
            <h3 className="font-medium">
              {t("assetSelection:selected_count", {
                name: assetName,
                count: internalValue.length,
              })}
            </h3>
            <Button
              btn="outline"
              onClick={handleClearAll}
              className="text-xs"
              title={t("assetSelection:clear_all")}
            />
          </div>

          <div className="flex-1 pt-4">
            {selectedAssets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {displaySelectedPlaceholder}
              </div>
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    rowCount={selectedAssets.length}
                    rowHeight={42}
                    width={width}
                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                    rowRenderer={({ index, key, style }) => (
                      <SelectedAssetRow
                        key={key}
                        index={index}
                        style={style}
                        data={{
                          items: selectedAssets,
                          handleRemoveAsset,
                        }}
                      />
                    )}
                  />
                )}
              </AutoSizer>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div
          className="flex items-center justify-between gap-4"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Pagination Info */}
          {totalRecords > 0 && (
            <div className="text-xs text-gray-600 font-medium">
              {assetName.charAt(0).toUpperCase() + assetName.slice(1)}{" "}
              {(() => {
                // Calculate the range of items shown in the list (left panel only)
                // Don't count selected items in right panel
                const loadedCount = filteredOptions.length;
                const start = loadedCount > 0 ? 1 : 0;
                // When using API search with pagination:
                // - If all records are loaded (no more to load), show totalRecords
                // - Otherwise, show the actual loaded count
                // Check if all records are loaded by comparing loadedCount with totalRecords
                // or if hasMore is false (no more pages to load)
                const allLoaded = !hasMore || loadedCount >= totalRecords;
                const end = allLoaded ? totalRecords : loadedCount;
                return `${start}-${end}`;
              })()}{" "}
              {t("assetSelection:of")} {totalRecords}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 ltr:ml-auto rtl:mr-auto">
            <Button
              btn="outline"
              onClick={onClose}
              title={t("cancel")}
            />
            <Button
              btn="primary"
              onClick={handleApply}
              disabled={loading}
              loading={loading}
              title={
                loading
                  ? t("assetSelection:selecting")
                  : t("assetSelection:selected_with_count", {
                      count: internalValue.length,
                    })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
