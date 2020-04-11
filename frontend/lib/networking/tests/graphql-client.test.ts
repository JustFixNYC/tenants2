import { createTestGraphQlClient as createClient } from '../../tests/util';

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

  it('rejects all requests when fetch fails', async () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');
    const err = new Error('oof');

    mockFetch.mockRejectedValue(err);
    client.fetchQueuedRequests();

    await expect(p1).rejects.toEqual(err);
    await expect(p2).rejects.toEqual(err);
  });

  it('resolves requests when fetch succeeds', async () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');

    mockFetch.mockResolvedValue({
      status: 200,
      json: () => [
        { data: "response 1" },
        { data: "response 2" },
      ]
    });
    client.fetchQueuedRequests();

    await expect(p1).resolves.toEqual("response 1");
    await expect(p2).resolves.toEqual("response 2");
  });

  it('raises error when status code is not 200', async () => {
    const { client, mockFetch } = createClient();

    const p = client.fetch('some graphql');
    mockFetch.mockResolvedValue({ status: 403 });
    client.fetchQueuedRequests();
    await expect(p).rejects.toHaveProperty('message', 'Expected HTTP 200, got 403');
  });

  it('resolves and rejects requests when fetch is mixed', async () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');
    const p2 = client.fetch('more graphql');

    mockFetch.mockResolvedValue({
      status: 200,
      json: () => [
        { data: "response 1" },
        { error: "blah" },
      ]
    });
    client.fetchQueuedRequests();

    await expect(p1).resolves.toEqual("response 1");
    await expect(p2).rejects.toHaveProperty('message', 'GraphQL request failed');
  });

  it('raises error when fetch array size is unexpected', async () => {
    const { client, mockFetch } = createClient();

    const p1 = client.fetch('some graphql');

    mockFetch.mockResolvedValue({ status: 200, json: () => [] });
    client.fetchQueuedRequests();

    await expect(p1).rejects.toHaveProperty(
      'message',
      'Result is not an array with size equal to requests'
    );
  });
});
