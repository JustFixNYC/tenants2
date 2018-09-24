interface Window {
  SafeMode: {
    /**
     * Let safe mode know that an error has been handled, so it
     * shouldn't show its UI if it sees the error.
     */
    ignoreError(e: Error): void;

    /**
     * Report an error to safe mode. Normally safe mode
     * automatically detects these via an error event
     * listener, so this is only really intended to be
     * used by tests.
     */
    reportError(e: Error): void;

     /**
     * Show the safe-mode opt-in UI. This is intended primarily
     * for manual testing, but client code can use it too.
     */
    showUI(): void;
  }
}
