import { getMapboxStateInfo, createMapboxPlacesURL } from "../common";
import { BROOKLYN_MAPBOX_FEATURE } from "./data";

describe("getMapboxStateInfo", () => {
  it("returns state info when state is found", () => {
    expect(getMapboxStateInfo(BROOKLYN_MAPBOX_FEATURE)).toEqual({
      stateCode: "NY",
      stateName: "New York",
    });
  });

  it("returns null when no state info was found", () => {
    expect(getMapboxStateInfo({ context: [] } as any)).toBe(null);
  });
});

test("createMapboxPlacesURL() works", () => {
  expect(
    createMapboxPlacesURL("blarg", {
      access_token: "access",
      country: "US",
      language: "en",
      types: ["locality", "address"],
    })
  ).toBe(
    "https://api.mapbox.com/geocoding/v5/mapbox.places/blarg.json?access_token=access&country=US&language=en&types=locality%2Caddress"
  );
});
