import H from "history";

export type AppLocationState = {
  noFocus?: boolean;
  noScroll?: boolean;
};

export type AppLocation = H.Location<AppLocationState>;

export type AppLocationDescriptor = H.LocationDescriptorObject<
  AppLocationState
>;

export function makeAppLocation(
  loc: AppLocationDescriptor
): AppLocationDescriptor {
  return loc;
}
