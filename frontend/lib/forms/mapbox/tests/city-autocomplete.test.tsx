import {
  mapboxCityAutocompleteHelpers as helpers,
  MapboxCityItem,
} from "../city-autocomplete";
import { BROOKLYN_MAPBOX_RESULTS, BROOKLYN_MAPBOX_FEATURE } from "./data";

const BROOKLYN_CITY: MapboxCityItem = {
  city: "Brooklyn",
  mapboxFeature: BROOKLYN_MAPBOX_FEATURE,
  stateChoice: "NY",
};

const INCOMPLETE_CITY: MapboxCityItem = {
  city: "blargblarg",
  mapboxFeature: null,
  stateChoice: null,
};

describe("mapboxCityAutocompleteHelpers", () => {
  it("converts item to key", () => {
    expect(helpers.itemToKey(BROOKLYN_CITY)).toBe("Brooklyn_NY");
  });

  it("converts item to string", () => {
    expect(helpers.itemToString(BROOKLYN_CITY)).toBe("Brooklyn, New York");
    expect(helpers.itemToString(INCOMPLETE_CITY)).toBe("blargblarg");
    expect(helpers.itemToString(null)).toBe("");
  });

  it("converts search results to items", () => {
    expect(helpers.searchResultsToItems(BROOKLYN_MAPBOX_RESULTS)).toEqual([
      BROOKLYN_CITY,
    ]);
  });

  it("converts incomplete items", () => {
    expect(helpers.getIncompleteItem("blarf")).toEqual({
      city: "blarf",
      mapboxFeature: null,
      stateChoice: null,
    });
  });
});
