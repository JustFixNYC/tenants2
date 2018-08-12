interface GraphQLBody {
  query: any;
  variables?: any;
}

export default class GraphQlClient {
  csrfToken: string;

  constructor(readonly batchGraphQLURL: string, csrfToken: string) {
    this.csrfToken = csrfToken;
    this.fetch = this.fetch.bind(this);
  }

  async fetch(query: string, variables?: any): Promise<any> {
    const body: GraphQLBody = { query };

    if (variables !== undefined) {
      body.variables = variables;
    }

    const response = await fetch(this.batchGraphQLURL, {
      method: 'POST',
      credentials: "same-origin",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': this.csrfToken,
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
}
