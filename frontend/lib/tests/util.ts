import GraphQlClient from "../graphql-client";
import { AppServerInfo } from "../app-server-info";
import { AppRequestInfo } from "../app-request-info";

interface TestClient {
  mockFetch: jest.Mock;
  client: GraphQlClient;
}

/**
 * Creates a GraphQL client useful for testing. It will never hit the network
 * because the fetch implementation it uses is a Jest mock.
 * 
 * @param enableTimeout Whether to enable the client's timeout-based fetch logic.
 *   If disabled (the default), your tests will need to manually tell the client
 *   to fetch queued requests.
 */
export function createTestGraphQlClient(enableTimeout: boolean = false): TestClient {
  const timeoutMs = enableTimeout ? undefined : null;
  const mockFetch = jest.fn()
    .mockName('fetch')
    .mockReturnValue(new Promise(() => {}));
  const client = new GraphQlClient('/mygraphql', 'mycsrf', timeoutMs, mockFetch);
  return { client, mockFetch };
}

export const FakeServerInfo: Readonly<AppServerInfo> = {
  staticURL: '/mystatic/',
  adminIndexURL: '/myadmin/',  
  debug: false,
  batchGraphQLURL: '/mygarphql'
};

export const FakeRequestInfo: Readonly<AppRequestInfo> = {
  username: null,
  csrfToken: 'mycsrf',
  url: '/',
};
