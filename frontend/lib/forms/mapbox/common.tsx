/**
 * These are forward geocoding search results as documented in:
 *
 * https://docs.mapbox.com/api/search/#geocoding-response-object
 */
export type MapboxResults = {
  type: "FeatureCollection";
  query: string[];
  features: MapboxFeature[];
  attribution: string;
};

type MapboxPlaceType =
  | "country"
  | "region"
  | "postcode"
  | "district"
  | "place"
  | "locality"
  | "neighborhood"
  | "address"
  | "poi";

export type MapboxFeature = {
  id: string;
  type: "Feature";
  place_type: MapboxPlaceType[];
  relevance: number;
  address?: string;
  properties: unknown;
  text: string;
  place_name: string;
  matching_text?: string;
  bbox: number[];
  center: number[];
  context: Array<Partial<MapboxFeature> & { short_code?: string }>;
};

export type MapboxStateInfo = {
  stateCode: string;
  stateName: string;
};

const MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

type MapboxSearchOptions = {
  access_token: string;
  country: "US";
  language: "en";
  types: MapboxPlaceType[];
};

export function createMapboxPlacesURL(
  query: string,
  options: MapboxSearchOptions
): string {
  const params = mapboxSearchOptionsToURLSearchParams(options).toString();
  const encodedQuery = encodeURIComponent(query);
  return `${MAPBOX_PLACES_URL}/${encodedQuery}.json?${params}`;
}

function mapboxSearchOptionsToURLSearchParams(
  options: MapboxSearchOptions
): URLSearchParams {
  return new URLSearchParams({
    ...options,
    types: options.types.join(","),
  });
}

export function getMapboxStateInfo(
  feature: MapboxFeature
): MapboxStateInfo | null {
  const SHORT_CODE_RE = /^US-([A-Z][A-Z])$/;
  for (let context of feature.context) {
    const match = (context.short_code || "").match(SHORT_CODE_RE);
    if (match && context.text) {
      return { stateCode: match[1], stateName: context.text };
    }
  }
  return null;
}
