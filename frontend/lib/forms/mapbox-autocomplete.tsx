import React from "react";
import { SearchRequester } from "@justfixnyc/geosearch-requester";
import { SearchAutocomplete } from "./search-autocomplete";
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
      // We want "locality" so folks can enter places like "Brooklyn".
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

export const MapboxCityAutocomplete: React.FC<{}> = () => {
  return (
    <SearchAutocomplete
      itemToKey={itemToKey}
      itemToString={itemToString}
      searchResultsToItems={searchResultsToItems}
      getIncompleteItem={getIncompleteItem}
      searchRequesterClass={MapboxCitySearchRequester}
      label="What city do you live in?"
      onChange={(item) => {
        console.log("CHANGE", item);
      }}
      onNetworkError={(err) => {
        console.error("ERROR", err);
      }}
    />
  );
};

function itemToKey(item: MapboxCityItem): string {
  return [item.city, item.stateCode].join("_");
}

function itemToString(item: MapboxCityItem | null): string {
  return item ? `${item.city}, ${item.stateName}` : "";
}

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

function searchResultsToItems(results: MapboxResults): MapboxCityItem[] {
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
}

function getIncompleteItem(value: string | null): MapboxCityItem {
  return {
    city: value || "",
    stateCode: "",
    stateName: "",
  };
}
