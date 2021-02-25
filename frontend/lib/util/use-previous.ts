import { useEffect, useRef } from "react";

/**
 * A React Hook that returns what a value was the last time the
 * current functional component was called.
 *
 * For more details, see:
 *
 *   https://blog.logrocket.com/how-to-get-previous-props-state-with-react-hooks/
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
