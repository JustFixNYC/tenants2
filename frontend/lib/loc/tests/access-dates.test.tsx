import React from "react";

import { getInitialState } from "../access-dates";
import Routes from "../../justfix-routes";
import LetterOfComplaintRoutes from "../letter-of-complaint";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { AccessDatesMutation_output } from "../../queries/AccessDatesMutation";

describe("access dates page", () => {
  afterEach(AppTesterPal.cleanup);

  it("redirects to next step after successful submission", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.locale.loc.accessDates,
    });

    pal.fillFormFields([[/First access date/i, "2018-01-02"]]);
    pal.clickButtonOrLink("Next");
    pal.respondWithFormOutput<AccessDatesMutation_output>({
      errors: [],
      session: { accessDates: ["2018-01-02"] },
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/call 311/i));
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
