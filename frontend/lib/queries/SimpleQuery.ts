// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SimpleQuery
// ====================================================

export interface SimpleQuery {
  hello: string;
}

export interface SimpleQueryVariables {
  thing: string;
}

export function fetchSimpleQuery(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: SimpleQueryVariables): Promise<SimpleQuery> {
  // The following query was taken from SimpleQuery.graphql.
  return fetchGraphQL(`query SimpleQuery($thing: String!) {
    hello(thing: $thing)
}
`, args);
}