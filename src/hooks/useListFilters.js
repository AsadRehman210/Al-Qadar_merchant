import { useEffect, useRef, useState } from "react";

const storageKey = (moduleKey) => `list-filters:${moduleKey}`;

// Single pointer to whichever module's useListFilters mounted most recently.
// Only list pages call this hook — a detour through a detail page or the
// dashboard (neither of which call it) leaves this untouched, which is
// exactly what lets "list -> detail -> back" preserve filters while a real
// "switch to a different module" resets them. Mirrors Tracking-IoT's
// zoneFilter.setZoneTab: entering ANY tab/module resets that tab's own
// filters, every time, unless you're already on it.
const ACTIVE_MODULE_KEY = "list-filters:__active-module__";

const readStored = (moduleKey, defaults) => {
  try {
    const raw = sessionStorage.getItem(storageKey(moduleKey));
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
};

// Resolves a module's filters for the moment it becomes active: if the
// previously-active module was this same one, its stored filters carry
// over untouched; if it was a different module (or none yet), this
// module's own stored filters are cleared first so it starts fresh.
const resolveActiveFilters = (moduleKey, defaults) => {
  let lastActive = null;
  try {
    lastActive = sessionStorage.getItem(ACTIVE_MODULE_KEY);
  } catch {
    // sessionStorage unavailable — treat every mount as a fresh module.
  }
  if (lastActive === moduleKey) {
    return readStored(moduleKey, defaults);
  }
  try {
    sessionStorage.removeItem(storageKey(moduleKey));
    sessionStorage.setItem(ACTIVE_MODULE_KEY, moduleKey);
  } catch {
    // ignore
  }
  return { ...defaults };
};

// Keeps a list page's filters (search/status/category/page/whatever the
// caller passes as `defaults`) alive across "go to a detail page, then come
// back" navigation — which otherwise resets to `defaults` every time,
// because filters normally live in plain `useState` and the list page
// unmounts when you navigate to a detail route. Switching to a genuinely
// different module (any other page that also calls this hook) resets that
// module's filters back to its own defaults, the same way Tracking-IoT's
// per-module filter slices reset on tab switch.
//
// Persistence is scoped per `moduleKey` in sessionStorage, so switching to a
// genuinely different module reads a different (empty, freshly-cleared) key
// and starts fresh automatically — no separate "reset on module change"
// call needed at each call site, it falls out of each module owning its own
// key plus the active-module check above.
//
// Usage: const [filters, setFilters, resetFilters] = useListFilters("assets-list", { search: "", status: "all", page: 1 });
// setFilters(partial) merges, same shape as setState with an updater object.
export const useListFilters = (moduleKey, defaults) => {
  const defaultsRef = useRef(defaults);
  const mountedModuleRef = useRef(moduleKey);
  const [filters, setFiltersState] = useState(() => resolveActiveFilters(moduleKey, defaultsRef.current));

  // Re-hydrate only if the caller renders this hook against a *different*
  // moduleKey during the component's lifetime (e.g. Requests/Approvals
  // parameterizes moduleKey by a `stage` prop instead of remounting) — the
  // lazy useState initializer above already resolved the initial mount, so
  // skip re-running the same (side-effecting) resolution redundantly here.
  useEffect(() => {
    if (mountedModuleRef.current === moduleKey) return;
    mountedModuleRef.current = moduleKey;
    setFiltersState(resolveActiveFilters(moduleKey, defaultsRef.current));
  }, [moduleKey]);

  const setFilters = (update) => {
    setFiltersState((prev) => {
      const next = typeof update === "function" ? update(prev) : { ...prev, ...update };
      try {
        sessionStorage.setItem(storageKey(moduleKey), JSON.stringify(next));
      } catch {
        // sessionStorage unavailable (private mode, quota) — filters just
        // won't persist across navigation this session, not a hard failure.
      }
      return next;
    });
  };

  const resetFilters = () => {
    try {
      sessionStorage.removeItem(storageKey(moduleKey));
    } catch {
      // ignore
    }
    setFiltersState(defaultsRef.current);
  };

  return [filters, setFilters, resetFilters];
};

export default useListFilters;
