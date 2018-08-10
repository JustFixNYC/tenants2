let csrfToken: string|null = null;
let batchGraphQLURL: string|null = null;

export function setCsrfToken(value: string) {
  csrfToken = value;
}

export function setBatchGraphQLURL(value: string) {
  batchGraphQLURL = value;
}

interface GraphQLBody {
  query: any;
  variables?: any;
}

export default async function fetchGraphQL(query: string, variables?: any): Promise<any> {
  if (!csrfToken) {
    throw new Error('csrf token has not been set');
  }
  if (!batchGraphQLURL) {
    throw new Error('batch graphql url has not been set');
  }
  const body: GraphQLBody = { query };

  if (variables !== undefined) {
    body.variables = variables;
  }

  const response = await fetch(batchGraphQLURL, {
    method: 'POST',
    credentials: "same-origin",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify([body])
  });

  const results = await response.json();

  // Even though we are technically using batching (just to make sure it
  // works), we're only batching one request right now, so unwrap it.
  if (Array.isArray(results) && results.length === 1) {
    const result = results[0];
    if (result && result.data) {
      return result.data;
    }
  }

  console.error(results);
  throw new Error(`Unexpected result, see console`);
}
