// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTenantResources
// ====================================================

export interface GetTenantResources_tenantResources {
  /**
   * The name of the tenant resource.
   */
  name: string;
  /**
   * The primary website of the tenant resource.
   */
  website: string;
  /**
   * The street address of the resource's office, including borough.
   */
  address: string;
  /**
   * The latitude of the tenant resource's address.
   */
  latitude: number;
  /**
   * The longitude of the tenant resource's address.
   */
  longitude: number;
  /**
   * The distance, in miles, that the resource's address is located from the
   * location provided in the query. The distance represents the 'straight line'
   * distance and does not take into account roads or other geographic features.
   */
  milesAway: number;
}

export interface GetTenantResources {
  /**
   * Find tenant resources that service the given location, ordered by their
   * proximity to the location. Note that if the tenant resource directory is
   * disabled on this endpoint, this will resolve to null.
   */
  tenantResources: GetTenantResources_tenantResources[] | null;
}

export interface GetTenantResourcesVariables {
  latitude: number;
  longitude: number;
}

export const GetTenantResources = {
  // The following query was taken from GetTenantResources.graphql.
  graphQL: `query GetTenantResources($latitude: Float!, $longitude: Float!) {
    tenantResources(latitude: $latitude, longitude: $longitude) {
        name,
        website,
        address,
        latitude,
        longitude,
        milesAway
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: GetTenantResourcesVariables): Promise<GetTenantResources> {
    return fetchGraphQL(GetTenantResources.graphQL, args);
  }
};

export const fetchGetTenantResources = GetTenantResources.fetch;