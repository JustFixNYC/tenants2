import React from "react";
import ReactTestingLibraryPal from "../../../../tests/rtl-pal";
import {
  HabitabilityLetterContent,
  habitabilitySampleLetterProps,
  getHabitabilityLetterContentPropsFromSession,
} from "../habitability-letter-content";
import { newSb } from "../../../../tests/session-builder";

describe("<HabitabilityContent>", () => {
  it("works", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <HabitabilityLetterContent
          {...habitabilitySampleLetterProps}
          todaysDate="2020-06-10"
        />
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});

const filledUser = newSb().withLoggedInJustfixUser().withLandlordDetails();

describe("getLocContentPropsFromSession()", () => {
  it("returns null when user is logged out", () => {
    expect(getHabitabilityLetterContentPropsFromSession(newSb().value)).toBe(
      null
    );
  });

  it("returns expected value when user is logged in", () => {
    expect(
      getHabitabilityLetterContentPropsFromSession(filledUser.value)
    ).toMatchSnapshot();
  });
});
