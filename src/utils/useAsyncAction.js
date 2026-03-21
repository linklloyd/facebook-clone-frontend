import { useState, useCallback, useRef } from "react";

/**
 * useAsyncAction — prevents double-triggering of async actions.
 * Returns [wrappedFn, isLoading].
 * While the action is running, subsequent calls are ignored.
 */
export function useAsyncAction(fn) {
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);

  const wrapped = useCallback(async (...args) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setLoading(true);
    try {
      return await fn(...args);
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }, [fn]);

  return [wrapped, loading];
}
