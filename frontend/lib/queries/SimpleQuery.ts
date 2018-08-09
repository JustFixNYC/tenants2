// This file was automatically generated and should not be edited.

import fetchGraphQL from '../fetch-graphql'


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SimpleQuery
// ====================================================

export interface SimpleQuery {
  hello: string | null;
}

export interface SimpleQueryVariables {
  thing?: string | null;
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
  return fetchGraphQL(`query SimpleQuery($thing: String) {
    hello(thing: $thing)
}
`, args);
}