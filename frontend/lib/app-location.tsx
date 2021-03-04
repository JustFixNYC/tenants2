import H from "history";

export type AppLocationState = {
  /** Disable default focus management when the URL changes. */
  noFocus?: boolean;

  /** Disable default scroll management when the URL changes. */
  noScroll?: boolean;
};

export type AppLocation = H.Location<AppLocationState>;

export type AppLocationDescriptor = H.LocationDescriptorObject<
  AppLocationState
>;

/**
 * Convenience function for creating an app-specific location
 * without needing to e.g. bind it to a typed variable first.
 */
export function makeAppLocation(
  loc: AppLocationDescriptor
): AppLocationDescriptor {
  return loc;
}
