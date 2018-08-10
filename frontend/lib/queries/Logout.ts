// This file was automatically generated and should not be edited.

import fetchGraphQL from '../fetch-graphql'


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Logout
// ====================================================

export interface Logout_logout {
  ok: boolean | null;
}

export interface Logout {
  logout: Logout_logout | null;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
export function fetchLogout(): Promise<Logout> {
  // The following query was taken from Logout.graphql.
  return fetchGraphQL(`mutation Logout {
    logout {
        ok
    }
}
`);
}