import React from "react";
import { SearchRequester } from "@justfixnyc/geosearch-requester";
import {
  SearchAutocomplete,
  SearchAutocompleteProps,
  SearchAutocompleteHelpers,
} from "../search-autocomplete";
import { getGlobalAppServerInfo } from "../../app-context";
import {
  MapboxFeature,
  MapboxStateInfo,
  getMapboxStateInfo,
  MapboxResults,
  createMapboxPlacesURL,
} from "./common";

class MapboxCitySearchRequester extends SearchRequester<MapboxResults> {
  searchQueryToURL(query: string): string {
    const { mapboxAccessToken } = getGlobalAppServerInfo();
    return createMapboxPlacesURL(query, {
      access_token: mapboxAccessToken,
      country: "US",
      language: "en",
      // We want "place" because it covers all cities, but we also want
      // "locality" so folks can enter places like "Brooklyn".
      types: ["place", "locality"],
    });
  }
}

export type MapboxCityItem = {
  city: string;
  mapboxFeature: MapboxFeature | null;
} & MapboxStateInfo;

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
      const stateInfo = getMapboxStateInfo(feature);
      if (stateInfo) {
        items.push({
          city: feature.text,
          mapboxFeature: feature,
          ...stateInfo,
        });
      }
    }
    return items;
  },
  getIncompleteItem(value) {
    return {
      city: value || "",
      mapboxFeature: null,
      stateCode: "",
      stateName: "",
    };
  },
  createSearchRequester: (options) => new MapboxCitySearchRequester(options),
};
