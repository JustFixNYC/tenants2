import { GraphQLFetch } from "./graphql-client";
import { RouteComponentProps } from "react-router";
import { AppContextType } from "../app-context";
import { isDeepEqual } from "../util/util";
import { getAppStaticContext } from "../app-static-context";

export interface QueryLoaderFetch<Input, Output> {
  (fetch: GraphQLFetch, args: Input): Promise<Output>;
}

export interface QueryLoaderQuery<Input, Output> {
  graphQL: string;
  name: string;
  fetch: QueryLoaderFetch<Input, Output>;
}

/**
 * This class encapsulates the plumbing needed to tell the
 * server process to pre-fetch GraphQL queries for us
 * during server-side rendering, and to retrieve
 * pre-fetched responses if they're available.
 */
export class QueryLoaderPrefetcher<Input, Output> {
  /** The response of the pre-fetched GraphQL query, if it's available. */
  readonly prefetchedResponse: Output | undefined;

  constructor(
    readonly router: RouteComponentProps,
    readonly appCtx: AppContextType,
    readonly query: QueryLoaderQuery<Input, Output>,
    readonly input: Input
  ) {
    const qr = this.appCtx.server.prefetchedGraphQLQueryResponse;
    if (
      qr &&
      qr.graphQL === this.query.graphQL &&
      isDeepEqual(qr.input, this.input)
    ) {
      // Our response has been pre-fetched.
      this.prefetchedResponse = qr.output;
    }
  }

  /**
   * If possible, tell the server to pre-fetch our GraphQL query.
   */
  maybeQueueForPrefetching() {
    if (this.prefetchedResponse !== undefined) return;
    const appStaticCtx = getAppStaticContext(this.router);
    if (appStaticCtx && !appStaticCtx.graphQLQueryToPrefetch) {
      // We're on the server-side, tell the server to pre-fetch our query.
      appStaticCtx.graphQLQueryToPrefetch = {
        graphQL: this.query.graphQL,
        input: this.input,
      };
    }
  }
}
