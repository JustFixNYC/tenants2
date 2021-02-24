import { useEffect } from "react";

/**
 * A React Hook that automatically focuses the given ref on
 * mount, and/or when the `shouldAutoFocus` prop changes to true.
 */
export function useAutoFocus(
  ref: React.RefObject<HTMLElement | null>,
  shouldAutoFocus?: boolean
) {
  useEffect(() => {
    if (
      shouldAutoFocus &&
      ref.current &&
      document.activeElement !== ref.current
    ) {
      ref.current.focus();
    }
  }, [shouldAutoFocus, ref]);
}
