import type { GraphQLFetch } from "./graphql-client";

/**
 * The default amount of milliseconds to wait before we actually issue
 * a search request.
 */
const DEFAULT_THROTTLE_MS = 250;

export interface FetchTextQuery<SearchResults> {
  (fetch: GraphQLFetch, args: { query: string }): Promise<{
    output: SearchResults;
  }>;
}

export interface FetchTextQueryInfo<SearchResults> {
  graphQL: string;
  fetch: FetchTextQuery<SearchResults>;
}

/**
 * Options for the requester constructor.
 */
export interface GraphQLSearchRequesterOptions<SearchResults> {
  fetchGraphQL: GraphQLFetch;

  queryInfo: FetchTextQueryInfo<SearchResults>;

  /**
   * The number of milliseconds to wait before we actually issue
   * a search request. This is primarily intended to allow
   * keyboard-based autocomplete UIs to not spam the server
   * when the user is typing quickly.
   *
   * If not provided, this defaults to 250 ms.
   */
  throttleMs?: number;

  /**
   * An optional callback that is called whenever a search
   * request has been aborted (because we've been given a
   * newer search request that takes priority).
   */
  onAbort?: (searchText: string) => void;

  /**
   * A callback that's called whenever an error occurs fetching
   * autocomplete results.
   */
  onError: (e: Error) => void;

  /**
   * A callback that's called whenever results are fetched for
   * the most recently issued query. This will never be
   * called for stale queries.
   */
  onResults: (results: SearchResults) => void;
}

/**
 * This class can be used to issue search requests
 * based on a query whose value may change over time
 * due to e.g. keyboard input.
 */
export class GraphQLSearchRequester<SearchResults> {
  private requestId: number;

  // We'd set this to something more specific than 'any' but we
  // want this code to work both in Node and the browser, and setTimeout()
  // has different return values depending on the environment. Sigh.
  private throttleTimeout: any | null;

  private fetch: GraphQLFetch;

  private query: FetchTextQueryInfo<SearchResults>;

  constructor(readonly options: GraphQLSearchRequesterOptions<SearchResults>) {
    this.requestId = 0;
    this.throttleTimeout = null;
    this.fetch = options.fetchGraphQL;
    this.query = options.queryInfo;
  }

  /**
   * Fetch results for the given query, returning null if the
   * network request was aborted.
   */
  private async fetchResults(query: string): Promise<SearchResults | null> {
    const results = await this.query.fetch(this.fetch, { query });
    return results.output;
  }

  /**
   * Fetch results for the given query, returning null if the
   * query was superseded by a newer one.
   */
  private async fetchResultsForLatestRequest(
    value: string
  ): Promise<SearchResults | null> {
    const originalRequestId = this.requestId;
    let results = await this.fetchResults(value);
    if (this.requestId === originalRequestId) {
      return results;
    }
    return null;
  }

  /**
   * Abort any currently in-flight requests.
   */
  private resetSearchRequest() {
    if (this.throttleTimeout !== null) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
    this.requestId++;
  }

  /**
   * Change the current search request to a new query. Return
   * whether the new query is non-empty.
   */
  changeSearchRequest(value: string): boolean {
    this.resetSearchRequest();
    if (value.length > 0) {
      this.throttleTimeout = setTimeout(() => {
        this.fetchResultsForLatestRequest(value)
          .catch(this.options.onError)
          .then((results) => {
            if (results) {
              this.options.onResults(results);
            }
          });
      }, this.options.throttleMs || DEFAULT_THROTTLE_MS) as any;
      return true;
    }
    return false;
  }

  /**
   * Clean up all resources used by the requester.
   */
  shutdown() {
    this.resetSearchRequest();
  }
}
