import React from "react";
import { SearchRequester } from "@justfixnyc/geosearch-requester";
import {
  SearchAutocomplete,
  SearchAutocompleteProps,
  SearchAutocompleteHelpers,
} from "./search-autocomplete";
import { getGlobalAppServerInfo } from "../app-context";

/**
 * These are forward geocoding search results as documented in:
 *
 * https://docs.mapbox.com/api/search/#geocoding-response-object
 */
type MapboxResults = {
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

type MapboxFeature = {
  id: string;
  type: "Feature";
  place_type: MapboxPlaceType[];
  relevance: number;
  address?: string;
  properties: unknown;
  text: string;
  place_name: string;
  matching_text?: string;
  bbox: [number, number, number, number];
  center: [number, number];
  context: Array<Partial<MapboxFeature> & { short_code?: string }>;
};

const MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

type MapboxSearchOptions = {
  access_token: string;
  country: "US";
  language: "en";
  types: MapboxPlaceType[];
};

function searchOptionsToURLSearchParams(
  options: MapboxSearchOptions
): URLSearchParams {
  return new URLSearchParams({
    ...options,
    types: options.types.join(","),
  });
}

class MapboxCitySearchRequester extends SearchRequester<MapboxResults> {
  searchQueryToURL(query: string): string {
    const { mapboxAccessToken } = getGlobalAppServerInfo();
    const params = searchOptionsToURLSearchParams({
      access_token: mapboxAccessToken,
      country: "US",
      language: "en",
      // We want "place" because it covers all cities, but we also want
      // "locality" so folks can enter places like "Brooklyn".
      types: ["place", "locality"],
    }).toString();
    const encodedQuery = encodeURIComponent(query);
    return `${MAPBOX_PLACES_URL}/${encodedQuery}.json?${params}`;
  }
}

type StateInfo = {
  stateCode: string;
  stateName: string;
};

type MapboxCityItem = {
  city: string;
} & StateInfo;

type MapboxCityAutocompleteProps = Omit<
  SearchAutocompleteProps<MapboxCityItem, MapboxResults>,
  "helpers"
>;

export const MapboxCityAutocomplete: React.FC<MapboxCityAutocompleteProps> = (
  props
) => {
  return (
    <SearchAutocomplete {...props} helpers={mapboxCityAutocompleteHelpers} />
  );
};

export const mapboxCityAutocompleteHelpers: SearchAutocompleteHelpers<
  MapboxCityItem,
  MapboxResults
> = {
  itemToKey(item) {
    return [item.city, item.stateCode].join("_");
  },
  itemToString(item) {
    return item
      ? item.stateName
        ? `${item.city}, ${item.stateName}`
        : item.city
      : "";
  },
  searchResultsToItems(results) {
    const items: MapboxCityItem[] = [];
    for (let feature of results.features) {
      const stateInfo = getStateInfo(feature);
      console.log(feature.place_name, feature, stateInfo);
      if (stateInfo) {
        items.push({
          city: feature.text,
          ...stateInfo,
        });
      }
    }
    return items;
  },
  getIncompleteItem(value) {
    return {
      city: value || "",
      stateCode: "",
      stateName: "",
    };
  },
  createSearchRequester: (options) => new MapboxCitySearchRequester(options),
};

function getStateInfo(feature: MapboxFeature): StateInfo | null {
  const SHORT_CODE_RE = /^US-([A-Z][A-Z])$/;
  for (let context of feature.context) {
    const match = (context.short_code || "").match(SHORT_CODE_RE);
    if (match && context.text) {
      return { stateCode: match[1], stateName: context.text };
    }
  }
  return null;
}
