import React from "react";

import { getInitialState } from "../access-dates";
import JustfixRoutes from "../../justfix-route-info";
import LetterOfComplaintRoutes from "../routes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { AccessDatesMutation } from "../../queries/AccessDatesMutation";
import { newSb } from "../../tests/session-builder";

describe("access dates page", () => {
  it("redirects to next step after successful submission", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.accessDates,
      session: newSb().withLoggedInJustfixUser().value,
    });

    pal.fillFirstFormField([/Date/i, "2018-01-02"]);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(AccessDatesMutation).respondWith({
      errors: [],
      session: { accessDates: ["2018-01-02"] },
    });

    await pal.rt.waitFor(() => pal.rr.getByText(/call 311/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({ accessDates: ["2018-01-02"] });
  });
});

describe("access dates page", () => {
  it("redirects NYCHA users to Work Order step after successful submission", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.accessDates,
      session: newSb().withLoggedInNychaJustfixUser().value,
    });

    pal.fillFirstFormField([/Date/i, "2018-01-02"]);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(AccessDatesMutation).respondWith({
      errors: [],
      session: { accessDates: ["2018-01-02"] },
    });

    await pal.rt.waitFor(() => pal.rr.getByText(/Work order repairs ticket/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({ accessDates: ["2018-01-02"] });
  });
});

test("getInitialState() works", () => {
  const BLANK = { date1: "", date2: "", date3: "" };
  const date1 = "2018-01-02";
  const date2 = "2019-01-02";

  expect(getInitialState([], new Date(2018, 0, 1))).toEqual({
    ...BLANK,
    date1: "2018-01-15",
  });
  expect(getInitialState([date1])).toEqual({ ...BLANK, date1 });
  expect(getInitialState([date1, date2])).toEqual({ ...BLANK, date1, date2 });
});
