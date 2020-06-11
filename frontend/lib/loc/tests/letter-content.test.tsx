import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  LocContent,
  locSampleProps,
  getLocContentPropsFromSession,
} from "../letter-content";
import { newSb } from "../../tests/session-builder";

describe("<LocContent>", () => {
  it("works", () => {
    const pal = new ReactTestingLibraryPal(
      <LocContent {...locSampleProps} todaysDate="2020-06-10" />
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});

const filledUser = newSb()
  .withLoggedInJustfixUser()
  .withLandlordDetails()
  .withCustomIssue()
  .withIssues();

describe("getLocContentPropsFromSession()", () => {
  it("returns null when user is logged out", () => {
    expect(getLocContentPropsFromSession(newSb().value)).toBe(null);
  });

  it("returns expected value when user is logged in", () => {
    expect(getLocContentPropsFromSession(filledUser.value)).toMatchSnapshot();
  });
});
