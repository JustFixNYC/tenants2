import autobind from 'autobind-decorator';
import { ResponseFromServer } from './app-static-context';

const DEFAULT_TIMEOUT_MS = 100;

export type GraphQLFetch = (query: string, variables?: any) => Promise<any>;

interface GraphQLBody {
  query: any;
  variables?: any;
}

export interface QueuedRequest {
  query: string;
  variables?: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

async function getFetch(): Promise<typeof fetch> {
  if (typeof(fetch) === 'function') {
    return Promise.resolve(fetch);
  }
  return (await import(/* webpackChunkName: "fetch" */ 'isomorphic-fetch')).default;
}

export class GraphQlError extends Error {
  constructor(message: string, readonly result: any) {
    super(message);
  }
}

export default class GraphQlClient {
  csrfToken: string;
  private readonly requestQueue: QueuedRequest[] = [];
  private timeout?: any;

  constructor(
    readonly batchGraphQLURL: string,
    csrfToken: string,
    readonly timeoutMs: number|null = DEFAULT_TIMEOUT_MS,
    readonly fetchImpl: typeof fetch|null = null,
    readonly responsesFromServer: ResponseFromServer[] = [],
  ) {
    this.csrfToken = csrfToken;
  }

  @autobind
  getRequestQueue(): QueuedRequest[] {
    return this.requestQueue.slice();
  }

  private createBodies(requests: QueuedRequest[]): GraphQLBody[] {
    return requests.map(({ query, variables }) => {
      const body: GraphQLBody = { query };

      if (variables !== undefined) {
        body.variables = variables;
      }

      return body;
    });
  }

  private async fetchBodies(bodies: GraphQLBody[]): Promise<Response> {
    const fetch = this.fetchImpl || (await getFetch());
    return fetch(this.batchGraphQLURL, {
      method: 'POST',
      credentials: "same-origin",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': this.csrfToken,
      },
      body: JSON.stringify(bodies)
    });
  }

  private resolveRequests(requests: QueuedRequest[], results: any[]) {
    requests.forEach(({ resolve, reject }, i) => {
      const result = results[i];
      if (result && result.data) {
        resolve(result.data);
      } else {
        reject(new GraphQlError('GraphQL request failed', result));
      }
    });
  }

  private rejectRequests(requests: QueuedRequest[], error: Error) {
    requests.forEach(({ reject }) => reject(error));
  }

  @autobind
  async fetchQueuedRequests() {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    const requests = this.requestQueue.splice(0);

    try {
      const bodies = this.createBodies(requests);
      const response = await this.fetchBodies(bodies);
      const results = await response.json();

      if (Array.isArray(results) && results.length === requests.length) {
        this.resolveRequests(requests, results);
      }

      throw new GraphQlError(
        `Result is not an array with size equal to requests`,
        results
      );
    } catch (e) {
      this.rejectRequests(requests, e);
    }
  }

  @autobind
  async fetch(query: string, variables?: any): Promise<any> {
    for (let res of this.responsesFromServer) {
      if (res.query === query) {
        // TODO: Also deep compare the variables.
        // TODO: There's some code duplication going on here from resolveRequests().
        if (res.response.data) {
          return Promise.resolve(res.response.data);
        } else {
          return Promise.reject(new GraphQlError('GraphQL request failed', res.response));
        }
      }
    }

    if (this.timeout === undefined && this.timeoutMs !== null) {
      this.timeout = setTimeout(this.fetchQueuedRequests, this.timeoutMs);
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ query, variables, resolve, reject });
    });
  }
}
