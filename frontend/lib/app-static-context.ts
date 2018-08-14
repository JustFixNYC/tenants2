import { StaticRouterContext, RouteComponentProps } from "react-router";

/**
 * This structure keeps track of anything we need during server-side
 * rendering. For more details, see:
 * 
 *   https://reacttraining.com/react-router/web/guides/server-rendering/
 */
export interface AppStaticContext {
  /** The HTTP status code we want our matched route to return. */
  statusCode: number;
}

/**
 * This is an extremely awkward workaround to what appears to be a
 * bug in react-router's typings.
 */
export function appStaticContextAsStaticRouterContext(obj: AppStaticContext) {
  return obj as StaticRouterContext;
}

/**
 * Detect if the given props have a static context, and if so, return
 * them. Otherwise return null.
 * 
 * This is partly a workaround to what appears to be a bug in react-router's
 * typings.
 */
export function getAppStaticContext(props: RouteComponentProps<any>): AppStaticContext|null {
  if (props && props.staticContext) {
    return props.staticContext as AppStaticContext;
  }
  return null;
}
