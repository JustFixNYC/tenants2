import GraphQlClient from "../graphql-client";

interface TestClient {
  mockFetch: jest.Mock;
  client: GraphQlClient;
}

function createClient(enableTimeout: boolean = false): TestClient {
  const timeoutMs = enableTimeout ? undefined : null;
  const mockFetch = jest.fn()
    .mockName('fetch')
    .mockReturnValue(new Promise(() => {}));
  const client = new GraphQlClient('/mygraphql', 'mycsrf', timeoutMs, mockFetch);
  return { client, mockFetch };
}

describe('GraphQLClient', () => {
  jest.useFakeTimers();

  it('sends batched request when timeout expires', () => {
    const { client, mockFetch } = createClient(true);

    client.fetch('some graphql');
    client.fetch('more graphql');

    expect(client.getRequestQueue().length).toBe(2);
    expect(mockFetch.mock.calls.length).toBe(0);

    jest.runAllTimers();

    expect(client.getRequestQueue().length).toBe(0);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  it('calls fetch() with expected arguments', () => {
    const { client, mockFetch } = createClient();

    client.fetch('some graphql', { some: 'variable' });

    expect(mockFetch.mock.calls.length).toBe(0);

    client.fetchQueuedRequests();

    expect(mockFetch.mock.calls.length).toBe(1);

    const callArgs = mockFetch.mock.calls[0];
    const fetchOpts = {
      ...callArgs[1],
      body: JSON.parse(callArgs[1].body)
    };

    expect(callArgs[0]).toEqual('/mygraphql');
    expect(fetchOpts).toEqual({
      method: 'POST',
      credentials: "same-origin",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': 'mycsrf',
      },
      body: [{
        query: "some graphql",
        variables: { some: "variable" }
      }]
    });
  });

  it('queues requests', () => {
    const { client } = createClient();

    client.fetch('some graphql', { some: 'variable' });
    client.fetch('more graphql');

    const reqs = client.getRequestQueue();

    expect(reqs.length).toBe(2);
    expect(reqs[0].query).toEqual('some graphql');
    expect(reqs[0].variables).toEqual({ some: 'variable' });
    expect(reqs[1].query).toEqual('more graphql');
    expect(reqs[1].variables).toBeUndefined();
  });

  it('rejects all requests when fetch fails', () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');
    const err = new Error('oof');

    mockFetch.mockRejectedValue(err);
    client.fetchQueuedRequests();

    expect(p1).rejects.toEqual(err);
    expect(p2).rejects.toEqual(err);
  });

  it('resolves requests when fetch succeeds', () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');

    mockFetch.mockResolvedValue({
      json: () => [
        { data: "response 1" },
        { data: "response 2" },
      ]
    });
    client.fetchQueuedRequests();

    expect(p1).resolves.toEqual("response 1");
    expect(p2).resolves.toEqual("response 2");
  });

  it('resolves and rejects requests when fetch is mixed', () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');

    mockFetch.mockResolvedValue({
      json: () => [
        { data: "response 1" },
        { error: "blah" },
      ]
    });
    client.fetchQueuedRequests();

    expect(p1).resolves.toEqual("response 1");
    expect(p2).rejects.toHaveProperty('message', 'GraphQL request failed');
  });

  it('raises error when fetch array size is unexpected', () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');

    mockFetch.mockResolvedValue({ json: () => [] });
    client.fetchQueuedRequests();

    expect(p1).rejects.toHaveProperty(
      'message',
      'Result is not an array with size equal to requests'
    );
  });
});
