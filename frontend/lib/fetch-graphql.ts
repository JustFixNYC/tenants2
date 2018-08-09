let csrfToken: string|null = null;

export function setCsrfToken(value: string) {
  csrfToken = value;
}

interface GraphQLBody {
  query: any;
  variables?: any;
}

export default async function fetchGraphQL(query: string, variables: any): Promise<any> {
  if (!csrfToken) {
    throw new Error('csrf token has not been set');
  }
  const body: GraphQLBody = { query };

  if (variables !== undefined) {
    body.variables = variables;
  }

  const response = await fetch('/graphql', {
    method: 'POST',
    credentials: "same-origin",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  if (result && result.data) {
    return result.data;
  }

  console.error(result);
  throw new Error(`Unexpected result, see console`);
}
