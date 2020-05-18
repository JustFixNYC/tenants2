import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
  getStreetWithApt,
} from "../letter-content";
import { initNationalMetadataForTesting } from "../letter-builder/tests/national-metadata-test-util";

beforeAll(initNationalMetadataForTesting);

describe("<NorentLetterContent>", () => {
  it("works", () => {
    const props = noRentSampleLetterProps;
    const pal = new ReactTestingLibraryPal(<NorentLetterContent {...props} />);
    expect(pal.rr.container).toMatchSnapshot();
  });
});

describe("getStreetWithApt()", () => {
  it("returns only street if apt is blank", () => {
    expect(getStreetWithApt({ street: "1234 Boop Way", aptNumber: "" })).toBe(
      "1234 Boop Way"
    );
  });

  it("returns street w/ apt if apt is present", () => {
    expect(getStreetWithApt({ street: "1234 Boop Way", aptNumber: "2" })).toBe(
      "1234 Boop Way #2"
    );
  });
});
