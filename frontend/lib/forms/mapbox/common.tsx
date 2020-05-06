import {
  USStateChoice,
  isUSStateChoice,
} from "../../../../common-data/us-state-choices";

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

const MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

const MAPBOX_STATE_SHORT_CODE_RE = /^US-([A-Z][A-Z])$/;

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

function stateChoiceFromShortCode(shortCode?: string): USStateChoice | null {
  if (shortCode === "pr") return "PR";
  const match = (shortCode || "").match(MAPBOX_STATE_SHORT_CODE_RE);
  const state = match ? match[1] : "";
  if (isUSStateChoice(state)) {
    return state;
  }
  return null;
}

export function getMapboxStateChoice(
  feature: MapboxFeature
): USStateChoice | null {
  for (let context of feature.context) {
    const stateChoice = stateChoiceFromShortCode(context.short_code);
    if (stateChoice) {
      return stateChoice;
    }
  }
  return null;
}
