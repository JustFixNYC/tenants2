import {
  createMapboxCityAutocompleteHelpers,
  MapboxCityItem,
} from "../city-autocomplete";
import { MapboxResults } from "../common";
import {
  BROOKLYN_MAPBOX_RESULTS,
  BROOKLYN_MAPBOX_FEATURE,
  SAN_JUAN_MAPBOX_FEATURE,
} from "./data";

const helpers = createMapboxCityAutocompleteHelpers();

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

  it("filters results by state if needed", () => {
    const nyHelpers = createMapboxCityAutocompleteHelpers({ forState: "NY" });

    const results: MapboxResults = {
      ...BROOKLYN_MAPBOX_RESULTS,
      features: [SAN_JUAN_MAPBOX_FEATURE, BROOKLYN_MAPBOX_FEATURE],
    };

    // Make sure the default helpers don't filter.
    expect(helpers.searchResultsToItems(results)).toHaveLength(2);

    // Make sure our NY-filtering helpers do filter.
    expect(nyHelpers.searchResultsToItems(results)).toHaveLength(1);
    expect(nyHelpers.searchResultsToItems(results)).toEqual([BROOKLYN_CITY]);
  });
});
