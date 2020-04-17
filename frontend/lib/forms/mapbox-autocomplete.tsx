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
};

const MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

class MapboxSearchRequester extends SearchRequester<MapboxResults> {
  searchQueryToURL(query: string): string {
    const { mapboxAccessToken } = getGlobalAppServerInfo();
    const params = new URLSearchParams({
      access_token: mapboxAccessToken,
    }).toString();
    const encodedQuery = encodeURIComponent(query);
    return `${MAPBOX_PLACES_URL}/${encodedQuery}.json?${params}`;
  }
}

type MapboxAutocompleteItem = {
  id: string;
  text: string;
};

export const MapboxAutocomplete: React.FC<{}> = () => {
  return (
    <SearchAutocomplete
      itemToKey={itemToKey}
      itemToString={itemToString}
      searchResultsToItems={searchResultsToItems}
      getIncompleteItem={getIncompleteItem}
      searchRequesterClass={MapboxSearchRequester}
      label="Enter an address"
      onChange={(item) => {
        console.log("CHANGE", item);
      }}
      onNetworkError={(err) => {
        console.error("ERROR", err);
      }}
    />
  );
};

function itemToKey(item: MapboxAutocompleteItem): string {
  return item.id;
}

function itemToString(item: MapboxAutocompleteItem | null): string {
  return item ? item.text : "";
}

function searchResultsToItems(
  results: MapboxResults
): MapboxAutocompleteItem[] {
  return results.features.map((feature) => ({
    id: feature.id,
    text: feature.text,
  }));
}

function getIncompleteItem(value: string | null): MapboxAutocompleteItem {
  return {
    id: value || "",
    text: value || "",
  };
}
