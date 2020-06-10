import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { LocContent, locSampleProps } from "../letter-content";

describe("<LocContent>", () => {
  it("works", () => {
    const pal = new ReactTestingLibraryPal(<LocContent {...locSampleProps} />);
    expect(pal.rr.container).toMatchSnapshot();
  });
});
