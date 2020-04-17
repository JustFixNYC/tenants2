import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
} from "../letter-content";

describe("<NorentLetterContent>", () => {
  afterEach(ReactTestingLibraryPal.cleanup);
  it("works", () => {
    const props = noRentSampleLetterProps;
    const pal = new ReactTestingLibraryPal(<NorentLetterContent {...props} />);
    pal.rr.findByText("Boop Jones");
  });
});
