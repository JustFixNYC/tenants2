/**
 * These props can be used for any component that presents
 * both a loading interstital and, optionally, a "retry"
 * button to retry the loading if any network errors occur.
 * 
 * Historical note: these props were originally a subset of the
 * ones react-loadable took, but we've since migrated away from
 * react-loadable because it was unmaintained.
 */
export type RetryableLoadingComponentProps = {
  /** The exception that occurred while loading, if any. */
  error: any;

  /** A callback to retry the loading process. */
  retry: () => void;
};
