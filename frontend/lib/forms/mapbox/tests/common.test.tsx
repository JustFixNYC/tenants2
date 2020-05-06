import { getMapboxStateChoice, createMapboxPlacesURL } from "../common";
import { BROOKLYN_MAPBOX_FEATURE, SAN_JUAN_MAPBOX_FEATURE } from "./data";

describe("getMapboxStateChoice", () => {
  it("returns state choice when state is found", () => {
    expect(getMapboxStateChoice(BROOKLYN_MAPBOX_FEATURE)).toEqual("NY");
  });

  it("works with puerto rico", () => {
    expect(getMapboxStateChoice(SAN_JUAN_MAPBOX_FEATURE)).toEqual("PR");
  });

  it("returns null when no state info was found", () => {
    expect(getMapboxStateChoice({ context: [] } as any)).toBe(null);
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
