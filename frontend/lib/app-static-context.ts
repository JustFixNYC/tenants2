import { StaticRouterContext, RouteComponentProps } from "react-router";
import { QueuedRequest } from "./graphql-client";

export type RequestForServer = {
  query: string;
  variables: any;
};

export type ResponseFromServer = {
  response: any;
} & RequestForServer;

interface PromiseMapValue {
  promise: Promise<any>;
  result?: any;
}

/**
 * This structure keeps track of anything we need during server-side
 * rendering. For more details, see:
 * 
 *   https://reacttraining.com/react-router/web/guides/server-rendering/
 */
export interface AppStaticContext {
  /** The HTTP status code we want our matched route to return. */
  statusCode: number;

  /**
   * The URL to redirect to, if any. This is automatically populated by
   * react-router's default <Redirect> component.
   */
  url?: string;

  /** The modal to render server-side, if any. */
  modal?: JSX.Element;

  /** The HTTP method of the request we're responding to. */
  method: 'GET'|'POST';

  /** The decoded application/x-www-form-urlencoded POST body, if we're responding to a POST. */
  postBody?: any;

  /** Whether or not we've handled the POST request (assuming we're responding to one). */
  wasPostHandled?: boolean;

  /** Get information about any GraphQL requests our components have made during our render. */
  getQueuedRequests?: () => QueuedRequest[];

  /** A mapping of Promises we need to fulfill before we can render our final response. */
  promiseMap: Map<string, PromiseMapValue>;

  /** Responses to any GraphQL queries the server has provided us with in advance. */
  responsesFromServer: ResponseFromServer[];
}

/**
 * This is an extremely awkward workaround to what appears to be a
 * bug in react-router's typings.
 */
export function appStaticContextAsStaticRouterContext(obj: AppStaticContext): StaticRouterContext {
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
