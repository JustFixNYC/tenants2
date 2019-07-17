import { GraphQLFetch } from "./graphql-client";
import { RouteComponentProps } from "react-router";
import { AppContextType } from "./app-context";
import { isDeepEqual } from "./util";
import { getAppStaticContext } from "./app-static-context";

export interface QueryLoaderFetch<Input, Output> {
  (fetch: GraphQLFetch, args: Input): Promise<Output>;
}

export interface QueryLoaderQuery<Input, Output> {
  graphQL: string;
  fetch: QueryLoaderFetch<Input, Output>;
}

export class QueryLoaderPrefetcher<Input, Output> {
  readonly prefetchedResponse: Output|undefined;

  constructor(
    readonly router: RouteComponentProps,
    readonly appCtx: AppContextType,
    readonly query: QueryLoaderQuery<Input, Output>,
    readonly input: Input
  ) {
    const qr = this.appCtx.server.prefetchedGraphQLQueryResponse;
    if (qr && qr.graphQL === this.query.graphQL && isDeepEqual(qr.input, this.input)) {
      // Our response has been pre-fetched.
      this.prefetchedResponse = qr.output;
    }
  }

  maybeQueueForPrefetching() {
    if (this.prefetchedResponse !== undefined) return;
    const appStaticCtx = getAppStaticContext(this.router);
    if (appStaticCtx && !appStaticCtx.graphQLQueryToPrefetch) {
      // We're on the server-side, tell the server to pre-fetch our query.
      appStaticCtx.graphQLQueryToPrefetch = {
        graphQL: this.query.graphQL,
        input: this.input
      };
    }
  }
}
