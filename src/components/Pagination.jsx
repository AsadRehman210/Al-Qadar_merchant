import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactPaginate from "react-paginate";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";

const MENU_WIDTH = 155;
const LIST_HEIGHT = 240;
const PAGE_ITEM_HEIGHT = 32;
const SEARCH_HEADER_HEIGHT = 72;
const BREAK_ATTR = "data-pagination-break";

const PageJumpDropdown = ({
  open,
  onOpenChange,
  anchorRect,
  totalPages,
  currentPage,
  onSelectPage,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let removeListeners;
    const bindTimer = window.setTimeout(() => {
      const handlePointerDown = (event) => {
        if (event.button === 2) return;
        const target = event.target;
        if (!target) return;
        if (menuRef.current?.contains(target)) return;
        onOpenChange(false);
      };
      const handleKeyDown = (event) => {
        if (event.key === "Escape") onOpenChange(false);
      };
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      removeListeners = () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, 0);

    return () => {
      window.clearTimeout(bindTimer);
      removeListeners?.();
    };
  }, [open, onOpenChange]);

  const filteredPages = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return null;
    const matches = [];
    for (let page = 1; page <= totalPages; page += 1) {
      if (String(page).includes(normalized)) matches.push(page);
    }
    return matches;
  }, [query, totalPages]);

  const pages = filteredPages ?? Array.from({ length: Math.max(totalPages, 0) }, (_, i) => i + 1);

  const position = useMemo(() => {
    if (!anchorRect) {
      return { left: 0, bottom: 0, maxHeight: SEARCH_HEADER_HEIGHT + LIST_HEIGHT };
    }
    const padding = 8;
    const gap = 4;
    const bottom = window.innerHeight - anchorRect.top + gap;
    const availableAbove = Math.max(120, anchorRect.top - gap - padding);
    const maxHeight = Math.min(SEARCH_HEADER_HEIGHT + LIST_HEIGHT, availableAbove);
    const preferredLeft = isRTL ? anchorRect.right - MENU_WIDTH : anchorRect.left;
    const maxLeft = window.innerWidth - MENU_WIDTH - padding;
    const left = Math.max(padding, Math.min(preferredLeft, maxLeft));
    return { left, bottom, maxHeight };
  }, [anchorRect, isRTL]);

  // Scroll near the current page when the unfiltered list opens.
  useEffect(() => {
    if (!open || filteredPages || !listRef.current) return;
    const index = Math.max(0, Math.min(currentPage - 1, Math.max(totalPages - 1, 0)));
    listRef.current.scrollTop = index * PAGE_ITEM_HEIGHT;
  }, [open, filteredPages, currentPage, totalPages]);

  const selectPage = (page) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      onOpenChange(false);
      return;
    }
    onOpenChange(false);
    // Close first so click-through cannot re-trigger the ellipsis break.
    window.setTimeout(() => onSelectPage(page), 0);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const exactPage = Number(query.trim());
    if (Number.isInteger(exactPage) && exactPage >= 1 && exactPage <= totalPages) {
      selectPage(exactPage);
      return;
    }
    if (filteredPages?.length === 1) selectPage(filteredPages[0]);
  };

  if (!mounted || !open || !anchorRect) return null;

  const listHeight = Math.min(
    LIST_HEIGHT,
    Math.max(position.maxHeight - SEARCH_HEADER_HEIGHT, PAGE_ITEM_HEIGHT),
    Math.max(pages.length, 1) * PAGE_ITEM_HEIGHT,
  );

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label={t("go_to_page")}
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed z-[200] flex flex-col overflow-hidden rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg"
      style={{
        bottom: position.bottom,
        left: position.left,
        width: MENU_WIDTH,
        maxHeight: position.maxHeight,
      }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="shrink-0 border-b border-slate-200 dark:border-white/10 px-2 py-2">
        <p className="mb-1.5 px-1 text-xs font-medium text-slate-500 dark:text-white/60">
          {t("go_to_page")}
        </p>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute top-1/2 start-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={query}
            onChange={(event) => setQuery(event.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("search_page")}
            aria-label={t("search_page")}
            className="flex h-8 w-full rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-1 ps-7 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {pages.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-slate-400">{t("no_pages_found")}</p>
      ) : (
        <div ref={listRef} className="overflow-y-auto" style={{ height: listHeight }}>
          {pages.map((page) => {
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                role="option"
                aria-selected={isCurrent}
                disabled={disabled || isCurrent}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.button !== 0) return;
                  selectPage(page);
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className={`flex h-8 w-full items-center px-3 text-sm tabular-nums transition-colors hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-500/20 dark:hover:text-teal-300 disabled:pointer-events-none disabled:opacity-50 ${
                  isCurrent ? "bg-teal-50 font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-300" : ""
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
};

/**
 * Drop-in replacement for `react-paginate` that keeps the existing
 * `{ selected }` onPageChange contract, and turns ellipsis breaks into a
 * searchable "go to page" jump menu (Tracking IoT pattern).
 */
const Pagination = ({
  pageCount = 0,
  forcePage = 0,
  currentPage: currentPageProp,
  onPageChange,
  pageRangeDisplayed = 3,
  marginPagesDisplayed = 1,
  breakLabel: _ignoredBreakLabel,
  nextLabel = <FaAngleRight />,
  previousLabel = <FaAngleLeft />,
  renderOnZeroPageCount = null,
  containerClassName = "custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm",
  disabled = false,
  ...rest
}) => {
  const { t } = useTranslation();
  const totalPages = Math.max(0, Number(pageCount) || 0);
  const currentPage =
    Number(currentPageProp) > 0
      ? Number(currentPageProp)
      : Math.max(1, (Number(forcePage) || 0) + 1);

  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpAnchorRect, setJumpAnchorRect] = useState(null);

  const openJumpMenu = useCallback(
    (anchor) => {
      if (disabled || totalPages <= 0) return;
      setJumpAnchorRect(anchor);
      setJumpOpen(true);
    },
    [disabled, totalPages],
  );

  const handleJumpOpenChange = useCallback((open) => {
    setJumpOpen(open);
    if (!open) setJumpAnchorRect(null);
  }, []);

  const emitPageChange = useCallback(
    (page) => {
      if (disabled || !onPageChange) return;
      if (page < 1 || page > totalPages) return;
      onPageChange({ selected: page - 1 });
    },
    [disabled, onPageChange, totalPages],
  );

  const handlePaginateClick = useCallback(
    (clickEvent) => {
      if (!clickEvent.isBreak) return;
      clickEvent.event.preventDefault?.();
      clickEvent.event.stopPropagation?.();
      const target = clickEvent.event.target;
      const breakEl =
        target?.closest?.(`[${BREAK_ATTR}]`) ??
        target?.closest?.("a") ??
        clickEvent.event.currentTarget;
      if (breakEl) openJumpMenu(breakEl.getBoundingClientRect());
      return false;
    },
    [openJumpMenu],
  );

  const breakLabel = (
    <span
      data-pagination-break=""
      title={t("click_to_jump")}
      aria-label={t("click_to_jump")}
      className="flex h-full w-full items-center justify-center select-none cursor-pointer"
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openJumpMenu(event.currentTarget.getBoundingClientRect());
      }}
    >
      ...
    </span>
  );

  return (
    <>
      <ReactPaginate
        {...rest}
        pageCount={totalPages}
        pageRangeDisplayed={pageRangeDisplayed}
        marginPagesDisplayed={marginPagesDisplayed}
        onPageChange={onPageChange}
        onClick={handlePaginateClick}
        forcePage={Math.max(0, Math.min(forcePage, Math.max(totalPages - 1, 0)))}
        breakLabel={breakLabel}
        nextLabel={nextLabel}
        previousLabel={previousLabel}
        renderOnZeroPageCount={renderOnZeroPageCount}
        containerClassName={containerClassName}
        disabledClassName={disabled ? "pointer-events-none opacity-50" : undefined}
      />
      <PageJumpDropdown
        open={jumpOpen}
        onOpenChange={handleJumpOpenChange}
        anchorRect={jumpAnchorRect}
        totalPages={totalPages}
        currentPage={currentPage}
        onSelectPage={emitPageChange}
        disabled={disabled}
      />
    </>
  );
};

export default Pagination;
