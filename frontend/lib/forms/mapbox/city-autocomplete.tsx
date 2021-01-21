import React from "react";
import {
  SearchRequester,
  SearchRequesterOptions,
} from "@justfixnyc/geosearch-requester";
import {
  SearchAutocomplete,
  SearchAutocompleteProps,
  SearchAutocompleteHelpers,
} from "../search-autocomplete";
import { getGlobalAppServerInfo } from "../../app-context";
import {
  MapboxFeature,
  getMapboxStateChoice,
  MapboxResults,
  createMapboxPlacesURL,
  MapboxBbox,
} from "./common";
import {
  USStateChoice,
  getUSStateChoiceLabels,
} from "../../../../common-data/us-state-choices";

class MapboxCitySearchRequester extends SearchRequester<MapboxResults> {
  readonly bbox?: MapboxBbox;

  constructor(
    options: SearchRequesterOptions<MapboxResults> & {
      bbox?: MapboxBbox;
    }
  ) {
    super(options);
    this.bbox = options.bbox;
  }

  searchQueryToURL(query: string): string {
    const { mapboxAccessToken } = getGlobalAppServerInfo();
    return createMapboxPlacesURL(query, {
      access_token: mapboxAccessToken,
      country: "US",
      language: "en",
      bbox: this.bbox,
      // We want "place" because it covers all cities, but we also want
      // "locality" so folks can enter places like "Brooklyn".
      types: ["place", "locality"],
    });
  }
}

export type MapboxCityItem = {
  city: string;
  mapboxFeature: MapboxFeature | null;
  stateChoice: USStateChoice | null;
};

type MapboxCityAutocompleteProps = Omit<
  SearchAutocompleteProps<MapboxCityItem, MapboxResults>,
  "helpers"
>;

export const MapboxCityAutocomplete: React.FC<
  MapboxCityAutocompleteProps & MapboxCityOptions
> = (props) => {
  return (
    <SearchAutocomplete
      {...props}
      helpers={createMapboxCityAutocompleteHelpers(props)}
    />
  );
};

export type MapboxCityOptions = {
  forState?: USStateChoice;
  bbox?: MapboxBbox;
};

export function createMapboxCityAutocompleteHelpers(
  options: MapboxCityOptions = {}
): SearchAutocompleteHelpers<MapboxCityItem, MapboxResults> {
  return {
    itemToKey(item) {
      return [item.city, item.stateChoice].join("_");
    },
    itemToString(item) {
      return item
        ? item.stateChoice
          ? `${item.city}, ${getUSStateChoiceLabels()[item.stateChoice]}`
          : item.city
        : "";
    },
    searchResultsToItems(results) {
      const items: MapboxCityItem[] = [];
      for (let feature of results.features) {
        const stateChoice = getMapboxStateChoice(feature);
        if (stateChoice) {
          if (options.forState && stateChoice !== options.forState) {
            continue;
          }
          items.push({
            city: feature.text,
            mapboxFeature: feature,
            stateChoice,
          });
        }
      }
      return items;
    },
    getIncompleteItem(value) {
      return {
        city: value || "",
        mapboxFeature: null,
        stateChoice: null,
      };
    },
    createSearchRequester: (srOptions) =>
      new MapboxCitySearchRequester({ ...srOptions, bbox: options.bbox }),
  };
}
