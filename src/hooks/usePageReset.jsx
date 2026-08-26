import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetAllSlicesCurrentPageDynamic } from "global/helper";

/**
 * Custom hook to automatically reset current page for all slices when navigating away from their respective routes
 * This hook should be used in your main layout component or router component
 *
 * This hook is now fully dynamic and automatically handles all slices with setCurrentPage actions
 * without requiring manual imports or configuration updates.
 */
export const usePageReset = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset all slice current pages when location changes using the dynamic system
    resetAllSlicesCurrentPageDynamic(location, dispatch);
  }, [location, dispatch]);
};
