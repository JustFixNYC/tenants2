import React from "react";
import {
  BoroughChoice,
  getBoroughChoiceLabels,
} from "../../../common-data/borough-choices";
import {
  GeoSearchBoroughGid,
  GeoSearchResults,
  GeoSearchRequester,
} from "@justfixnyc/geosearch-requester";
import {
  SearchAutocompleteProps,
  SearchAutocomplete,
  SearchAutocompleteHelpers,
} from "./search-autocomplete";
import { getGlobalAppServerInfo } from "../app-context";

function boroughGidToChoice(gid: GeoSearchBoroughGid): BoroughChoice {
  switch (gid) {
    case GeoSearchBoroughGid.Manhattan:
      return "MANHATTAN";
    case GeoSearchBoroughGid.Bronx:
      return "BRONX";
    case GeoSearchBoroughGid.Brooklyn:
      return "BROOKLYN";
    case GeoSearchBoroughGid.Queens:
      return "QUEENS";
    case GeoSearchBoroughGid.StatenIsland:
      return "STATEN_ISLAND";
  }

  throw new Error(`No borough found for ${gid}!`);
}

export interface GeoAutocompleteItem {
  address: string;
  borough: BoroughChoice | null;
}

type GeoAutocompleteProps = Omit<
  SearchAutocompleteProps<GeoAutocompleteItem, GeoSearchResults>,
  "helpers"
>;

/** The maximum number of autocomplete suggestions to show. */
const MAX_SUGGESTIONS = 5;

/**
 * A NYC address autocomplete field. This should only be used as a
 * progressive enhancement, since it requires JavaScript and uses
 * a third-party API that might become unavailable.
 */
export function GeoAutocomplete(props: GeoAutocompleteProps) {
  return <SearchAutocomplete {...props} helpers={geoAutocompleteHelpers} />;
}

function getAutocompleteUrl(): string {
  const origin = getGlobalAppServerInfo().nycGeoSearchOrigin;
  return `${origin}/v2/autocomplete`;
}

const geoAutocompleteHelpers: SearchAutocompleteHelpers<
  GeoAutocompleteItem,
  GeoSearchResults
> = {
  itemToKey: itemToKey,
  itemToString: geoAutocompleteItemToString,
  searchResultsToItems: geoSearchResultsToAutocompleteItems,
  getIncompleteItem: getIncompleteItem,
  createSearchRequester: (options) =>
    new GeoSearchRequester({
      ...options,
      customGeoAutocompleteUrl: getAutocompleteUrl(),
    }),
};

function itemToKey(item: GeoAutocompleteItem): string {
  return item.address + item.borough;
}

/**
 * Set the current selected item to an address consisting of the user's current
 * input and no borough.
 *
 * This is basically a fallback to ensure that the user's input isn't lost if
 * they are typing and happen to (intentionally or accidentally) do something
 * that causes the autocomplete to lose focus.
 */
function getIncompleteItem(value: string | null): GeoAutocompleteItem {
  return {
    address: value || "",
    borough: null,
  };
}

export function geoAutocompleteItemToString(
  item: GeoAutocompleteItem | null
): string {
  if (!item) return "";
  if (!item.borough) return item.address;
  return `${item.address}, ${getBoroughChoiceLabels()[item.borough]}`;
}

export function geoSearchResultsToAutocompleteItems(
  results: GeoSearchResults
): GeoAutocompleteItem[] {
  return results.features.slice(0, MAX_SUGGESTIONS).map((feature) => {
    const { borough_gid } = feature.properties;
    const borough = boroughGidToChoice(borough_gid);

    return {
      address: feature.properties.name,
      borough,
    };
  });
}
