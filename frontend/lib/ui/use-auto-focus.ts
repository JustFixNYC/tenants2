import { useEffect } from "react";

/**
 * A React Hook that automatically gives input focus to the given ref
 * under the following conditions:
 *
 *   * At mount time, if `shouldAutoFocus` is true at mount.
 *   * Whenever the `shouldAutoFocus` prop changes from `false` or `undefined`
 *     to `true`.
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
