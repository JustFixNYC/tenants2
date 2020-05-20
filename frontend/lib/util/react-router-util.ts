import * as H from "history";
import { LinkProps } from "react-router-dom";

/**
 * At some point React Router's "to" prop for their <Link> component
 * started supporting functions that took a location and returned
 * a LocationDescriptor, but their typings didn't provide a name
 * for them. This just gives them a name.
 */
export type LocationDescriptorOrResolver<S> = LinkProps<S>["to"];

/**
 * Takes the "to" prop of a <Link> component and resolves it to
 * a LocationDescriptor.
 */
export function resolveLocationDescriptor<S>(
  value: LocationDescriptorOrResolver<S>,
  location: H.Location<S>
): H.LocationDescriptor<S> {
  return typeof value === "function" ? value(location) : value;
}
