import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { FaCheck, FaChevronDown, FaSpinner } from "react-icons/fa6";
import { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import Error from "images/icons/error.png";
import { IoCloseOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { debounce } from "global/helper";

export default function SearchablePaginatedDropdown({
  label,
  data,
  selected,
  setSelected,
  classes,
  labelClass,
  errors,
  name,
  register,
  required,
  trigger,
  setValue,
  className,
  disabled,
  placeholder,
  hideClear,
  emptyMessage,
  loading = false,
  // API search props
  enableApiSearch = false, // If true, uses API search instead of local filtering
  onApiSearch, // Callback function for API-based search
  debounceTime = 500, // Debounce delay for API search (in milliseconds)
  // Pagination props
  hasMore = false, // Flag indicating if more data is available to load
  onLoadMore, // Callback function to load more data (infinite scroll)
  paginationLoading = false, // Loading state during pagination
}) {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  const optionsRef = useRef(null); // Reference to the options container for scroll handling
  const scrollPositionRef = useRef(0); // Reference to track scroll position (updated by scroll events)
  const targetScrollPositionRef = useRef(0); // Reference to store target scroll position (protected from overwrites)
  const scrollableElementRef = useRef(null); // Reference to the actual scrollable element
  const scrollHandlerRef = useRef(null); // Reference to the scroll handler for cleanup
  const previousScrollHeightRef = useRef(0); // Reference to track previous scroll height for position restoration
  const isRestoringScrollRef = useRef(false); // Flag to prevent scroll events during restoration
  const shouldClearOnNextChange = useRef(false); // Flag to clear selected value on next onChange
  const isProgrammaticQueryUpdateRef = useRef(false); // Flag to prevent API calls when query is set programmatically (from selection)

  /**
   * Debounced API search function
   * Delays API calls to prevent excessive requests while user is typing
   * Only triggers API search after user stops typing for the specified debounce time
   */
  const debouncedApiSearchRef = useRef(null);

  useEffect(() => {
    debouncedApiSearchRef.current = debounce((value) => {
      if (onApiSearch) onApiSearch(value);
    }, debounceTime);

    return () => {
      // Cleanup: cancel any pending debounced calls
      if (debouncedApiSearchRef.current) {
        debouncedApiSearchRef.current = null;
      }
    };
  }, [onApiSearch, debounceTime]);

  /**
   * Filtered options based on search query
   * - If API search is enabled, uses data directly from API (already filtered by backend)
   */
  const filteredData = useMemo(() => {
    // If API search is enabled, use data from API directly (already filtered by backend)
    if (enableApiSearch) {
      return data || [];
    }

    // If API search is disabled, return all data (no local filtering)
    return data || [];
  }, [data, enableApiSearch]);

  useEffect(() => {
    // Check if selected is empty object or has a title
    const hasSelection =
      selected && Object.keys(selected).length > 0 && selected.title;

    // Mark that this is a programmatic update (from selection, not user input)
    isProgrammaticQueryUpdateRef.current = true;

    if (hasSelection) {
      setQuery(selected.title); // Set the input value
      if (setValue && trigger) {
        setValue(name, selected.title); // Set the form value
        trigger(name); // Trigger validation
      }
    } else {
      // Clear the input when selected is empty
      setQuery("");
      if (setValue) {
        setValue(name, "");
      }
    }

    // Reset flag after a small delay to allow any side effects to complete
    // This prevents API calls when query is set programmatically
    setTimeout(() => {
      isProgrammaticQueryUpdateRef.current = false;
    }, 0);
  }, [selected, setValue, trigger, name]);

  /**
   * Handle search input change
   * Updates the search query and triggers API search if enabled
   * Resets scroll position on new search (like AssetSelection does)
   * Prevents editing selected value - only allows search when no selection
   */
  const handleSearchChange = (value) => {
    // Don't trigger API search if this is a programmatic update (from selection)
    if (isProgrammaticQueryUpdateRef.current) {
      setQuery(value);
      return;
    }

    // Check if there's a selected value
    const hasSelection =
      selected && Object.keys(selected).length > 0 && selected.title;

    // If we need to clear on next change (user started typing), use the new value directly
    if (shouldClearOnNextChange.current) {
      shouldClearOnNextChange.current = false;
      setQuery(value);
      // Reset scroll position on new search (not pagination)
      if (enableApiSearch && value !== query) {
        scrollPositionRef.current = 0;
        targetScrollPositionRef.current = 0;
        previousScrollHeightRef.current = 0;
        isRestoringScrollRef.current = false;
      }
      if (enableApiSearch && onApiSearch && debouncedApiSearchRef.current) {
        debouncedApiSearchRef.current(value);
      }
      return;
    }

    // If there's a selection and user is trying to edit/delete it
    if (hasSelection && value !== selected.title) {
      // Prevent deleting characters from selected value
      if (value.length < selected.title.length) {
        return;
      }
      // Prevent typing after selected value (appending to it)
      if (
        value.startsWith(selected.title) &&
        value.length > selected.title.length
      ) {
        return;
      }
      // Allow typing completely new text (user wants to search)
      // This will be handled by onKeyDown which sets the flag
    }

    setQuery(value);
    // Reset scroll position on new search (not pagination)
    if (enableApiSearch && value !== query) {
      scrollPositionRef.current = 0;
      targetScrollPositionRef.current = 0;
      previousScrollHeightRef.current = 0;
      isRestoringScrollRef.current = false;
    }
    if (enableApiSearch && onApiSearch && debouncedApiSearchRef.current) {
      debouncedApiSearchRef.current(value);
    }
  };

  /**
   * Find scrollable element and attach scroll event listener
   * This handles infinite scroll pagination and preserves scroll position
   * Similar to AssetSelection's handleScroll function
   */
  useEffect(() => {
    let scrollableElement = null;
    let scrollHandler = null;
    let timer = null;

    // Use a small delay to ensure DOM is fully rendered
    timer = setTimeout(() => {
      // Find the scrollable element - try optionsRef first, then look for scrollable child
      const findScrollableElement = () => {
        if (!optionsRef.current) return null;

        const element = optionsRef.current;

        // Check if the element itself is scrollable (has overflow)
        // Even if scrollHeight === clientHeight, it might still scroll when content grows
        if (
          element.scrollHeight >= element.clientHeight ||
          element.style.overflowY === "auto" ||
          element.style.overflowY === "scroll"
        ) {
          return element;
        }

        // Look for scrollable child elements (Headless UI might wrap content)
        const children = Array.from(element.children);
        for (const child of children) {
          if (
            child.scrollHeight >= child.clientHeight ||
            child.style.overflowY === "auto" ||
            child.style.overflowY === "scroll"
          ) {
            return child;
          }
        }

        // Fallback to the element itself (always return element for ComboboxOptions)
        return element;
      };

      // Define scroll handler first (before using it)
      scrollHandler = (e) => {
        // Ignore scroll events during restoration to prevent conflicts
        if (isRestoringScrollRef.current) {
          return;
        }

        const target = e.currentTarget || e.target;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;

        // Only store scroll position if element is valid (not closed/unmounted)
        // This prevents resetting to 0 when dropdown closes
        if (scrollHeight > 0 && clientHeight > 0) {
          // Store current scroll position (same as AssetSelection)
          scrollPositionRef.current = scrollTop;
        }

        // Trigger pagination when user is within 50px of the bottom (same as AssetSelection)
        if (scrollHeight - scrollTop <= clientHeight + 50) {
          // Only load more if there's more data available and not already loading
          if (hasMore && !paginationLoading && onLoadMore) {
            // Store scroll height BEFORE loading more (for restoration)
            previousScrollHeightRef.current = scrollHeight;
            onLoadMore();
          }
        }
      };

      scrollableElement = findScrollableElement();
      if (!scrollableElement) {
        // Retry after a longer delay if element not found
        setTimeout(() => {
          const retryElement = findScrollableElement();
          if (retryElement && scrollHandler) {
            scrollableElementRef.current = retryElement;
            scrollHandlerRef.current = scrollHandler;
            retryElement.addEventListener("scroll", scrollHandler, {
              passive: true,
            });
          }
        }, 200);
        return;
      }

      // Store reference for scroll position restoration
      scrollableElementRef.current = scrollableElement;
      scrollHandlerRef.current = scrollHandler;
      scrollableElement.addEventListener("scroll", scrollHandler, {
        passive: true,
      });
    }, 100);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      // Cleanup scroll handler using ref
      if (scrollableElementRef.current && scrollHandlerRef.current) {
        scrollableElementRef.current.removeEventListener(
          "scroll",
          scrollHandlerRef.current,
        );
        scrollHandlerRef.current = null;
      }
    };
  }, [hasMore, paginationLoading, onLoadMore, data, filteredData, loading]);

  /**
   * Get currently visible option index based on scroll position
   * Helper function to track which option user is viewing
   */
  const getVisibleOptionIndex = (scrollTop, itemHeight = 42) => {
    return Math.floor(scrollTop / itemHeight);
  };

  /**
   * Prevent scroll reset during data update
   * This effect runs synchronously when data changes to prevent scrollbar from jumping to top
   * useLayoutEffect runs before browser paint, so it can prevent the visual jump
   * CRITICAL: Use targetScrollPositionRef which is protected from scroll event overwrites
   */
  useLayoutEffect(() => {
    // Only prevent reset if we're in pagination mode (have stored position)
    // Use targetScrollPositionRef which stores the position before onLoadMore was called
    const scrollableElement = scrollableElementRef.current;
    if (!scrollableElement) return;

    // If we have a stored scroll position, restore it immediately
    // This prevents the scrollbar from jumping to top during re-render
    if (targetScrollPositionRef.current > 0) {
      // Set scroll position synchronously before browser paint
      scrollableElement.scrollTop = targetScrollPositionRef.current;
      // Also update scrollPositionRef to keep them in sync
      scrollPositionRef.current = targetScrollPositionRef.current;
    } else if (scrollPositionRef.current > 0 && !paginationLoading) {
      // If targetScrollPositionRef is 0 but we have a stored position, use that
      // This handles cases where targetScrollPositionRef might have been cleared
      scrollableElement.scrollTop = scrollPositionRef.current;
    }
  }, [data, filteredData, paginationLoading]);

  /**
   * Restore scroll position after new data loads during pagination
   * Simplified approach like AssetSelection - maintain exact scroll position
   * AssetSelection uses react-virtualized which handles this automatically,
   * but for Headless UI ComboboxOptions we need to do it manually
   *
   * Key: Use targetScrollPositionRef which was stored BEFORE onLoadMore was called
   */
  useEffect(() => {
    // Wait for loading to finish before restoring
    if (paginationLoading) {
      return;
    }

    const scrollableElement = scrollableElementRef.current;
    if (!scrollableElement) {
      return;
    }

    // Use targetScrollPositionRef if available, otherwise use scrollPositionRef
    // targetScrollPositionRef is the position stored right before onLoadMore was called
    const targetScrollTop =
      targetScrollPositionRef.current > 0
        ? targetScrollPositionRef.current
        : scrollPositionRef.current;

    // Only restore if we have a valid scroll position
    if (targetScrollTop <= 0) {
      return;
    }

    // Simple restoration: maintain exact scrollTop (like AssetSelection)
    // Use multiple attempts to ensure DOM is ready
    const restoreScroll = () => {
      if (!scrollableElement) {
        isRestoringScrollRef.current = false;
        return;
      }

      const newScrollHeight = scrollableElement.scrollHeight;
      const currentScrollTop = scrollableElement.scrollTop;

      // Only restore if the current scroll position is different from target
      // This prevents unnecessary restoration
      if (Math.abs(currentScrollTop - targetScrollTop) > 1) {
        // Simple approach: Always maintain the same scrollTop value
        // This keeps the user at the exact same visual position
        // New data is added at bottom, so scroll position stays the same
        scrollableElement.scrollTop = targetScrollTop;

        // Update stored positions for next pagination
        scrollPositionRef.current = targetScrollTop;
        previousScrollHeightRef.current = newScrollHeight;
      }

      // Clear restoration flag after restoration
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 100);
    };

    // Set flag to prevent scroll events during restoration
    isRestoringScrollRef.current = true;

    // Try immediately
    requestAnimationFrame(() => {
      restoreScroll();
      // Also try after a small delay to ensure DOM is fully updated
      setTimeout(() => {
        restoreScroll();
      }, 10);
      // One more attempt after a longer delay for slow DOM updates
      setTimeout(() => {
        restoreScroll();
      }, 50);
    });

    return () => {
      isRestoringScrollRef.current = false;
    };
  }, [data, filteredData, paginationLoading]);

  const handleSelect = (value) => {
    // Mark that this is a programmatic update (from selection, not user input)
    isProgrammaticQueryUpdateRef.current = true;
    setSelected(value);
    setQuery(value?.title || ""); // Update input value
    // Reset flag after a small delay
    setTimeout(() => {
      isProgrammaticQueryUpdateRef.current = false;
    }, 0);
  };

  const getErrorMessage = () => {
    if (!name) return null;

    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break; // If no error found, break out of the loop
    }
    return error?.message;
  };

  const errorMessage = getErrorMessage(); // Cache the error message to avoid multiple checks

  const isSelected = (item, selectedItem) => {
    if (item?._id) {
      return item?._id === selectedItem?._id;
    } else {
      return item.id === selectedItem.id;
    }
  };

  return (
    <div className="w-full relative">
      {label && (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label} <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}

      {name && (
        <input
          value={selected?.title || ""}
          {...register(name, { required })}
          className="absolute pointer-events-none -z-10 inset-0 opacity-0"
          type="text"
        />
      )}

      <Combobox value={selected} onChange={(value) => handleSelect(value)}>
        <div className="relative">
          <ComboboxInput
            className={`${classes || ""} ${
              errors && errors[name] ? "border-red" : "border-[#E2E8F0]"
            } ${clsx(
              "h-10 p-[8px_16px] rounded-md border bg-white placeholder:text-gray  text-black transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 w-full",
            )} disabled:!cursor-not-allowed`}
            id={name}
            disabled={disabled}
            placeholder={placeholder || t("select_here")}
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => {
              // Check if there's a selected value
              const hasSelection =
                selected && Object.keys(selected).length > 0 && selected.title;

              // When user starts typing a new character (not backspace/delete/arrow keys)
              // Set flag to clear selected value on next onChange
              if (hasSelection && query === selected.title) {
                // Detect if user is typing a printable character (not control keys)
                const isPrintableKey =
                  event.key.length === 1 && // Single character (letter, number, symbol)
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey;

                if (isPrintableKey) {
                  // User is typing a new character - set flag to clear on next onChange
                  shouldClearOnNextChange.current = true;
                }
              }
            }}
          />

          {!hideClear && selected?.title && (
            <button
              type="button"
              className={`group absolute inset-y-0 inline-flex items-center ltr:right-7 rtl:left-7 px-2 ${
                disabled ? "z-0" : "z-[50]"
              }`}
              onClick={(e) => e.preventDefault()}
            >
              <IoCloseOutline
                className="size-6 text-[#64748B] group-data-[hover]:fill-black cursor-pointer"
                onClick={() => {
                  setSelected({});
                  setQuery("");
                  // Reset API search to page 1 with empty query when clearing selection
                  if (enableApiSearch && onApiSearch) {
                    onApiSearch("");
                  }
                }}
              />
            </button>
          )}

          <ComboboxButton
            className="group absolute inset-0 right-0 z-40 px-2.5 flex justify-end items-center disabled:!cursor-not-allowed"
            disabled={disabled}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <FaChevronDown className="size-4 fill-black/60 group-data-[hover]:fill-black" />
            )}
          </ComboboxButton>
        </div>
        <ComboboxOptions
          ref={optionsRef}
          anchor="bottom"
          className={`${className} w-[var(--input-width)] !max-h-[250px] rounded-lg shadow-lg bg-white  p-1 [--anchor-gap:var(--spacing-1)] empty:hidden !z-[9999] overflow-y-auto`}
          onScroll={(e) => {
            // Ignore scroll events during restoration to prevent conflicts
            if (isRestoringScrollRef.current) {
              return;
            }

            // Direct scroll handler (same pattern as AssetSelection)
            const target = e.currentTarget;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;

            // Only store scroll position if element is valid (not closed/unmounted)
            if (scrollHeight > 0 && clientHeight > 0) {
              // Store current scroll position (same as AssetSelection)
              // Only update scrollPositionRef, NOT targetScrollPositionRef
              // targetScrollPositionRef is only set when onLoadMore is called
              scrollPositionRef.current = scrollTop;
            }

            // Trigger pagination when user is within 50px of the bottom (same as AssetSelection)
            if (scrollHeight - scrollTop <= clientHeight + 50) {
              // Only load more if there's more data available and not already loading
              if (hasMore && !paginationLoading && onLoadMore) {
                // Store scroll height BEFORE loading more (for restoration)
                // Only store if element is valid
                if (scrollHeight > 0 && clientHeight > 0) {
                  // CRITICAL: Store scroll position IMMEDIATELY before calling onLoadMore
                  // This prevents it from being overwritten during re-render
                  // Store both refs to ensure we have the position available
                  targetScrollPositionRef.current = scrollTop;
                  scrollPositionRef.current = scrollTop;
                  previousScrollHeightRef.current = scrollHeight;

                  // Set flag to prevent scroll events from overwriting our stored position
                  isRestoringScrollRef.current = true;

                  // Call onLoadMore - this will trigger data update and scroll restoration
                  onLoadMore();
                }
              }
            }
          }}
        >
          {loading ? (
            <ComboboxOption className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              <div className="text-sm/6 text-black">{t("loading")}</div>
            </ComboboxOption>
          ) : filteredData?.length > 0 ? (
            <>
              {filteredData?.map((person, idx) => {
                const itemIsSelected =
                  isSelected && selected && isSelected(person, selected);
                return (
                  <ComboboxOption
                    key={idx}
                    value={person}
                    className={`group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-black/10 relative z-10 ${
                      itemIsSelected ? "bg-black/10" : ""
                    }`}
                  >
                    {/* Full-area click wrapper: z-index above any overlap, inner text has pointer-events-none so click hits wrapper */}
                    <div
                      className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer relative z-10"
                      style={{ pointerEvents: "auto" }}
                      onClick={() => handleSelect(person)}
                    >
                      <FaCheck
                        className={`pointer-events-none ${
                          itemIsSelected ? "visible" : "invisible"
                        } size-4 fill-black shrink-0`}
                      />
                      <div
                        className="text-sm/6 text-black truncate"
                        style={{ pointerEvents: "none" }}
                      >
                        {person?.title}
                      </div>
                    </div>
                  </ComboboxOption>
                );
              })}
              {/* Pagination loading indicator at bottom (like AssetSelection) */}
              {paginationLoading && (
                <div className="flex justify-center items-center py-2 px-3">
                  <FaSpinner className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
            </>
          ) : (
            // Only show empty message when not loading (API returned empty array)
            !loading && (
              <ComboboxOption className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                <FaCheck className="invisible size-4 fill-black group-data-[selected]:visible" />
                <div className="text-sm/6 text-black">
                  {emptyMessage || t("no_option")}
                </div>
              </ComboboxOption>
            )
          )}
        </ComboboxOptions>
      </Combobox>
      {/* Show error message */}
      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="Error" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
