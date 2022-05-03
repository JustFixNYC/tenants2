import React from "react";
import ReactTestingLibraryPal from "../../../../tests/rtl-pal";
import {
  HabitabilityLetterContent,
  habitabilitySampleLetterProps,
  getHabitabilityLetterContentPropsFromSession,
} from "../habitability-letter-content";
import { newSb } from "../../../../tests/session-builder";

describe("<HabitabilityContent>", () => {
  it("renders", () => {
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

  it("includes issues and rooms", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <HabitabilityLetterContent
          {...habitabilitySampleLetterProps}
          todaysDate="2020-06-10"
        />
      )
    );
    expect(pal.rr.getAllByText("{roomLabel}")).toHaveLength(2);
    expect(pal.rr.getAllByText("{issueLabel}")).toHaveLength(1);
  });

  it("translates into spanish", () => {});
});

const filledUser = newSb().withLoggedInJustfixUser().withLandlordDetails();

describe("getHabitabilityContentPropsFromSession()", () => {
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
