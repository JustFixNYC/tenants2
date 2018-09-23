interface Window {
  SafeMode: {
    /**
     * Let safe mode know that an error has been handled, so it
     * shouldn't show its UI if it sees the error.
     */
    ignoreError(e: Error): void;
  }
}
