"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/utils/locales/LanguageContext";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SelectOption } from "./multi-select-box";

export interface PaginatedSelectOption extends SelectOption {
  raw?: unknown;
}

export interface PaginatedSelectLoadParams {
  page: number;
  size: number;
  search: string;
}

export interface PaginatedSelectLoadResult {
  options: PaginatedSelectOption[];
  hasNextPage?: boolean;
  totalPages?: number;
}

export interface PaginatedSingleSelectBoxProps {
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
  onValueChange?: (value: string | number | null) => void;
  onOptionChange?: (option: PaginatedSelectOption | null) => void;
  loadOptions: (
    params: PaginatedSelectLoadParams,
  ) => Promise<PaginatedSelectLoadResult>;
  selectedOption?: PaginatedSelectOption | null;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  className?: string;
  valueType?: "string" | "number";
  clearable?: boolean;
  searchable?: boolean;
  size?: "sm" | "md" | "lg";
  emptyMessage?: string;
  disabled?: boolean;
  pageSize?: number;
  searchDebounceMs?: number;
  searchPlaceholder?: string;
  loadingMessage?: string;
  loadingMoreMessage?: string;
  menuHeight?: number | string;
  onBlur?: () => void;
  onFocus?: () => void;
  /** QA automation hook for the combobox trigger. */
  testId?: string;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const isFirstEffect = useRef(true);

  useEffect(() => {
    // Skip the mount tick — state already matches `value`, and scheduling
    // setState would risk an extra loadOptions call after the delay.
    if (isFirstEffect.current) {
      isFirstEffect.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
) {
  const [position, setPosition] = useState<"bottom" | "top">("bottom");

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      setPosition(
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow
          ? "top"
          : "bottom",
      );
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef]);

  return position;
}

function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  callback: () => void,
  isActive: boolean,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isInside = refs.some((ref) => ref.current?.contains(target));

      if (!isInside) {
        callbackRef.current();
      }
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener("mousedown", handleClick, true);
      document.addEventListener("touchstart", handleClick, true);
    }, 100);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("touchstart", handleClick, true);
    };
  }, [refs, isActive]);
}

function getOptionKey(
  value: string | number | null | undefined,
  valueType: "string" | "number",
) {
  if (value === null || value === undefined || value === "") return "";
  return valueType === "number" ? String(Number(value)) : String(value);
}

function mergeOptions(
  existing: PaginatedSelectOption[],
  incoming: PaginatedSelectOption[],
  valueType: "string" | "number",
) {
  const seen = new Set(
    existing.map((option) => getOptionKey(option.value, valueType)),
  );
  const next = [...existing];

  incoming.forEach((option) => {
    const key = getOptionKey(option.value, valueType);
    if (!key || seen.has(key)) return;
    seen.add(key);
    next.push(option);
  });

  return next;
}

export function PaginatedSingleSelectBox({
  value,
  onChange,
  onValueChange,
  onOptionChange,
  loadOptions,
  selectedOption: externalSelectedOption,
  placeholder = "Select an option",
  label,
  helperText,
  errorMessage,
  required = false,
  className,
  valueType = "string",
  clearable = true,
  searchable = true,
  size = "md",
  emptyMessage,
  disabled = false,
  pageSize = 50,
  searchDebounceMs = 500,
  searchPlaceholder,
  loadingMessage,
  loadingMoreMessage,
  menuHeight = 280,
  onBlur,
  onFocus,
  testId,
}: PaginatedSingleSelectBoxProps) {
  const tForm = useTranslations("form");
  const tLoading = useTranslations("loading");
  const emit = onChange ?? onValueChange;
  const emitRef = useRef(emit);
  const loadOptionsRef = useRef(loadOptions);
  const valueTypeRef = useRef(valueType);
  const requestIdRef = useRef(0);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<PaginatedSelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, searchDebounceMs);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emitRef.current = emit;
  }, [emit]);

  useEffect(() => {
    loadOptionsRef.current = loadOptions;
  }, [loadOptions]);

  useEffect(() => {
    valueTypeRef.current = valueType;
  }, [valueType]);

  const position = useDropdownPosition(
    triggerRef as React.RefObject<HTMLElement | null>,
    isOpen,
  );

  const clickOutsideRefs = useMemo(
    () => [
      triggerRef as React.RefObject<HTMLElement | null>,
      dropdownRef as React.RefObject<HTMLElement | null>,
    ],
    [],
  );

  useClickOutside(
    clickOutsideRefs,
    () => {
      setIsOpen(false);
      onBlur?.();
    },
    isOpen,
  );

  const panelMaxPx = useMemo(() => {
    if (typeof menuHeight === "number" && menuHeight > 0) return menuHeight;
    const parsed = parseInt(String(menuHeight).replace(/px\s*$/i, ""), 10);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : 280;
  }, [menuHeight]);

  const optionsMap = useMemo(() => {
    const map = new Map<string, PaginatedSelectOption>();
    options.forEach((option) => {
      map.set(getOptionKey(option.value, valueType), option);
    });
    return map;
  }, [options, valueType]);

  const selectedOption = useMemo(() => {
    const key = getOptionKey(value, valueType);
    if (!key) return undefined;

    const loadedOption = optionsMap.get(key);
    if (loadedOption) return loadedOption;

    if (
      externalSelectedOption &&
      getOptionKey(externalSelectedOption.value, valueType) === key
    ) {
      return externalSelectedOption;
    }

    return undefined;
  }, [externalSelectedOption, optionsMap, value, valueType]);

  const hasValue = value !== null && value !== undefined && value !== "";

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean, search: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsFetching(true);
      setIsInitialLoading(replace);

      try {
        const result = await loadOptionsRef.current({
          page: nextPage,
          size: pageSize,
          search,
        });

        if (requestId !== requestIdRef.current) return;

        const incomingOptions = result.options ?? [];
        setOptions((prev) =>
          replace
            ? incomingOptions
            : mergeOptions(prev, incomingOptions, valueTypeRef.current),
        );
        setPage(nextPage);
        setHasNextPage(
          result.hasNextPage ??
            (result.totalPages != null ? nextPage < result.totalPages : false),
        );
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (replace) setOptions([]);
        setHasNextPage(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsFetching(false);
          setIsInitialLoading(false);
        }
      }
    },
    [pageSize],
  );

  // Load page 1 on mount (and when search changes); further pages load on scroll.
  useEffect(() => {
    void loadPage(1, true, debouncedSearch.trim());
  }, [debouncedSearch, loadPage]);

  useEffect(() => {
    if (isOpen && searchable) {
      const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onBlur]);

  const handleToggle = () => {
    if (disabled) return;

    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        onFocus?.();
      } else {
        onBlur?.();
      }
      return nextOpen;
    });
  };

  const emitSelection = (option: PaginatedSelectOption | null) => {
    if (!option) {
      emitRef.current?.(null);
      onOptionChange?.(null);
      return;
    }

    const nextValue =
      valueTypeRef.current === "number"
        ? Number(option.value)
        : String(option.value);

    emitRef.current?.(
      typeof nextValue === "number" && Number.isNaN(nextValue)
        ? null
        : nextValue,
    );
    onOptionChange?.(option);
  };

  const handlePick = (option: PaginatedSelectOption) => {
    emitSelection(option);
    setIsOpen(false);
    onBlur?.();
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    emitSelection(null);
    setSearchQuery("");
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

    if (reachedBottom && hasNextPage && !isFetching) {
      void loadPage(page + 1, false, debouncedSearch.trim());
    }
  };

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const resolvedSearchPlaceholder =
    searchPlaceholder ?? tForm("searchOptions") ?? "Search...";
  const resolvedLoadingMessage =
    loadingMessage ?? tLoading("default") ?? "Loading...";
  const resolvedLoadingMoreMessage =
    loadingMoreMessage ?? tLoading("default") ?? "Loading...";

  return (
    <div className={cn("space-y-1 text-left relative", isOpen && "z-[99999]", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="relative z-[1]">
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            data-testid={testId}
            aria-expanded={isOpen}
            aria-required={required}
            aria-invalid={!!errorMessage}
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[size],
              errorMessage && "border-red-500",
            )}
          >
            <span
              className={cn(
                "truncate text-left flex-1",
                !selectedOption && "text-muted-foreground",
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            {isInitialLoading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            )}
          </button>

          {clearable && hasValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute ltr:right-8 rtl:left-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent z-[2]"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">{tForm("clearSelection")}</span>
            </Button>
          )}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              "z-[99999] rounded-md border bg-popover text-popover-foreground shadow-xl",
              "animate-in fade-in-0 zoom-in-95",
              position === "bottom"
                ? "slide-in-from-top-2"
                : "slide-in-from-bottom-2",
            )}
            style={{
              position: "absolute",
              zIndex: 99999,
              top: position === "bottom" ? "100%" : "auto",
              bottom: position === "top" ? "100%" : "auto",
              left: 0,
              right: 0,
              marginTop: position === "bottom" ? 4 : 0,
              marginBottom: position === "top" ? 4 : 0,
              maxHeight: panelMaxPx,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {searchable && (
              <div className="flex items-center border-b px-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={resolvedSearchPlaceholder}
                  className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}

            <div
              className="overflow-y-auto p-1"
              style={{ maxHeight: Math.max(72, panelMaxPx - 44) }}
              onScroll={handleScroll}
            >
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {resolvedLoadingMessage}
                  </span>
                </div>
              ) : options.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground px-2">
                  {emptyMessage ||
                    tForm("noOptionsFound") ||
                    "No options found."}
                </div>
              ) : (
                <>
                  {options.map((option) => {
                    const isSelected =
                      getOptionKey(option.value, valueType) ===
                      getOptionKey(value, valueType);

                    return (
                      <div
                        key={getOptionKey(option.value, valueType)}
                        onClick={() => handlePick(option)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent/50",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{option.label}</span>
                      </div>
                    );
                  })}

                  {isFetching && !isInitialLoading && (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{resolvedLoadingMoreMessage}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export default PaginatedSingleSelectBox;
