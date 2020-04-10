import { useState, useEffect } from "react";

/**
 * A React Hook that "debounces" the given value, ensuring that the value
 * returned by the hook is one that hasn't changed in the given number of
 * milliseconds.
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timeout);
  }, [ms, value]);

  return debouncedValue;
}
