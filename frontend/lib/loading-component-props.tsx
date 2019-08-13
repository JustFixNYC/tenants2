/**
 * These props are a subset of the ones react-loadable takes.
 * As such, components that use them can be passed as a 'loading'
 * option to react-loadable's Loadable HOC factory function, but
 * they can also be used with other code.
 */
export type MinimalLoadingComponentProps = {
  /** The exception that occurred while loading, if any. */
  error: any;

  /** A callback to retry the loading process. */
  retry: () => void;
};
