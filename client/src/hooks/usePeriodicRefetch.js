import { useEffect } from "react";

/** Default refresh cadence for live catalog / admin data while the tab is open. */
export const AUTO_REFRESH_INTERVAL_MS = 12_000;

/**
 * While the document is visible, bumps state on an interval and when the user returns to the tab.
 * Use with `const [refetchTick, setRefetchTick] = useState(0)` and include `refetchTick` in fetch effect deps.
 */
export function usePeriodicRefetch(setTick, intervalMs = AUTO_REFRESH_INTERVAL_MS) {
  useEffect(() => {
    const bump = () => {
      if (document.visibilityState === "visible") {
        setTick((n) => n + 1);
      }
    };

    const intervalId = window.setInterval(bump, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setTick((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [setTick, intervalMs]);
}

/**
 * Runs `callback` on the same schedule when the tab is visible (no tick state).
 * Callback should be stable (useCallback).
 */
export function usePeriodicVisibleCallback(callback, intervalMs = AUTO_REFRESH_INTERVAL_MS) {
  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") {
        callback();
      }
    };

    const intervalId = window.setInterval(run, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        callback();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [callback, intervalMs]);
}
