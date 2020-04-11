import {
  browserStorage,
  updateAddressFromBrowserStorage,
} from "../browser-storage";

describe("updateAddressFromBrowserStorage()", () => {
  afterEach(() => browserStorage.clear());

  it("updates address/borough details if they exist", () => {
    browserStorage.update({
      latestAddress: "blorp",
      latestBorough: "BROOKLYN",
    });
    expect(
      updateAddressFromBrowserStorage({ z: 1, address: "", borough: "" })
    ).toEqual({
      z: 1,
      address: "blorp",
      borough: "BROOKLYN",
    });
  });

  it("does not override existing address/borough details if they are non-empty", () => {
    browserStorage.update({
      latestAddress: "blorp",
      latestBorough: "BROOKLYN",
    });
    expect(
      updateAddressFromBrowserStorage({ z: 1, address: "a", borough: "BRONX" })
    ).toEqual({
      z: 1,
      address: "a",
      borough: "BRONX",
    });
  });
});
