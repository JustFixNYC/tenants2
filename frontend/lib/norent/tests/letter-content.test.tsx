import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
  getStreetWithApt,
} from "../letter-content";
import { initNationalMetadataForTesting } from "../letter-builder/tests/national-metadata-test-util";
import { override } from "../../tests/util";
import { NorentI18nProviderForTests } from "./i18n-provider-for-tests";

beforeAll(initNationalMetadataForTesting);

describe("<NorentLetterContent>", () => {
  it("works", () => {
    const props = override(noRentSampleLetterProps, {
      todaysDate: "2020-04-15T15:41:37.114Z",
    });
    const pal = new ReactTestingLibraryPal(
      (
        <NorentI18nProviderForTests>
          <NorentLetterContent {...props} />
        </NorentI18nProviderForTests>
      )
    );
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
