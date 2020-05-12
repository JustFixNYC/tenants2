import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  GeoAutocomplete,
  geoSearchResultsToAutocompleteItems,
  geoAutocompleteItemToString,
} from "../geo-autocomplete";
import { createMockFetch } from "../../networking/tests/mock-fetch";
import { FakeGeoResults } from "../../tests/util";
import { KEY_TAB } from "../../util/key-codes";

describe("GeoAutocomplete", () => {
  const onChange = jest.fn();
  const onNetworkError = jest.fn();
  const fetch = createMockFetch();
  const props = {
    label: "enter an address",
    onChange,
    onNetworkError,
    fetch,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    onChange.mockClear();
    onNetworkError.mockClear();
    fetch.mockClear();
  });

  

  it("shows suggestions and calls onChange() when one is clicked", async () => {
    fetch.mockReturnJson(FakeGeoResults);
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    pal.fillFormFields([[/address/i, "150 cou"]]);
    await fetch.resolvePromisesAndTimers();
    expect(onNetworkError.mock.calls).toHaveLength(0);
    expect(onChange.mock.calls).toHaveLength(0);
    pal.clickListItem(/150 COURT STREET/);
    expect(onChange.mock.calls).toHaveLength(1);
    expect(onChange.mock.calls[0][0]).toEqual({
      address: "150 COURT STREET",
      borough: "MANHATTAN",
    });
  });

  it("auto-completes to first suggestion when tab is pressed", async () => {
    fetch.mockReturnJson(FakeGeoResults);
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    pal.fillFormFields([[/address/i, "150 cou"]]);
    await fetch.resolvePromisesAndTimers();
    pal.keyDownOnFormField(/address/i, KEY_TAB);
    expect(onChange.mock.calls).toHaveLength(1);
    expect(onChange.mock.calls[0][0]).toEqual({
      address: "150 COURT STREET",
      borough: "MANHATTAN",
    });
  });

  it("selects incomplete address when tab is pressed and no suggestions exist", async () => {
    fetch.mockReturnJson({ features: [] });
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    pal.fillFormFields([[/address/i, "150 cou"]]);
    await fetch.resolvePromisesAndTimers();
    pal.keyDownOnFormField(/address/i, KEY_TAB);
    expect(onChange.mock.calls).toHaveLength(1);
    expect(onChange.mock.calls[0][0]).toEqual({
      address: "150 cou",
      borough: null,
    });
  });

  it("calls onNetworkError on failure", async () => {
    fetch.mockRejectedValue(new Error("blah"));
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    pal.fillFormFields([[/address/i, "150 cou"]]);
    await fetch.resolvePromisesAndTimers();
    expect(onNetworkError.mock.calls).toHaveLength(1);
    expect(onNetworkError.mock.calls[0][0].message).toEqual("blah");
  });

  it("ignores AbortError exceptions", async () => {
    fetch.mockRejectedValue(new DOMException("aborted", "AbortError"));
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    pal.fillFormFields([[/address/i, "150 cou"]]);
    await fetch.resolvePromisesAndTimers();
    expect(onNetworkError.mock.calls).toHaveLength(0);
  });

  it("throttles network requests", () => {
    const pal = new ReactTestingLibraryPal(<GeoAutocomplete {...props} />);
    const inputText = "150 court";
    for (let i = 0; i < inputText.length; i++) {
      pal.fillFormFields([[/address/i, inputText.slice(0, i)]]);
      jest.advanceTimersByTime(10);
    }
    jest.advanceTimersByTime(1000);
    expect(fetch.mock.calls).toHaveLength(1);
  });

  it("raises error on unexpected borough_gid", () => {
    expect(() =>
      geoSearchResultsToAutocompleteItems({
        features: [{ properties: { borough_gid: "blah" } }],
      } as any)
    ).toThrow("No borough found for blah!");
  });

  it("converts API results to autocomplete items", () => {
    expect(geoSearchResultsToAutocompleteItems(FakeGeoResults)).toEqual([
      {
        borough: "MANHATTAN",
        address: "150 COURT STREET",
      },
    ]);
  });

  it("converts autocomplete items to strings", () => {
    expect(
      geoAutocompleteItemToString({
        borough: "MANHATTAN",
        address: "150 COURT STREET",
      })
    ).toEqual("150 COURT STREET, Manhattan");
    expect(geoAutocompleteItemToString(null)).toEqual("");
  });
});
