import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
} from "../letter-content";
import { initNationalMetadataForTesting } from "../letter-builder/tests/national-metadata-test-util";

beforeAll(initNationalMetadataForTesting);

describe("<NorentLetterContent>", () => {
  
  it("works", () => {
    const props = noRentSampleLetterProps;
    const pal = new ReactTestingLibraryPal(<NorentLetterContent {...props} />);
    pal.rr.findByText("Boop Jones");
  });
});
