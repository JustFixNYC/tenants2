// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExampleQuery
// ====================================================

export interface ExampleQuery_exampleQuery {
  hello: string | null;
}

export interface ExampleQuery {
  exampleQuery: ExampleQuery_exampleQuery;
}

export interface ExampleQueryVariables {
  input: string;
}

export const ExampleQuery = {
  // The following query was taken from ExampleQuery.graphql.
  graphQL: `query ExampleQuery($input: String!) {
    exampleQuery {
		hello(argument: $input)
    }
}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: ExampleQueryVariables): Promise<ExampleQuery> {
    return fetchGraphQL(ExampleQuery.graphQL, args);
  }
};

export const fetchExampleQuery = ExampleQuery.fetch;