// This file was automatically generated and should not be edited.

import fetchGraphQL from '../fetch-graphql'


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

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
export function fetchSimpleQuery(args: SimpleQueryVariables): Promise<SimpleQuery> {
  // The following query was taken from SimpleQuery.graphql.
  return fetchGraphQL(`query SimpleQuery($thing: String!) {
    hello(thing: $thing)
}
`, args);
}