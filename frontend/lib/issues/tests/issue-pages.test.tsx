import React from "react";

import { IssuesRoutes, getIssueLabel, groupByTwo } from "../issue-pages";
import JustfixRoutes from "../../justfix-routes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import ISSUE_AREA_SVGS from "../../svg/issues";
import { IssueAreaChoices } from "../../../../common-data/issue-area-choices";
import { IssueAreaV2Mutation } from "../../queries/IssueAreaV2Mutation";

const routes = JustfixRoutes.locale.loc.issues;

const TestIssuesRoutes = () => (
  <IssuesRoutes
    routes={JustfixRoutes.locale.loc.issues}
    toBack="back"
    toNext="next"
  />
);

describe("issues checklist", () => {
  afterEach(AppTesterPal.cleanup);

  it("returns 404 for invalid area routes", () => {
    const pal = new AppTesterPal(<TestIssuesRoutes />, {
      url: routes.area.create("LOL"),
    });
    pal.rr.getByText("Alas.");
  });

  it("works on valid area routes", async () => {
    const pal = new AppTesterPal(<TestIssuesRoutes />, {
      url: routes.area.create("HOME"),
      session: {
        issues: ["BEDROOMS__PAINT"],
      },
    });
    pal.clickRadioOrCheckbox(/Mice/i);
    pal.clickButtonOrLink("Save");

    pal
      .withFormMutation(IssueAreaV2Mutation)
      .expect({
        area: "HOME",
        issues: ["HOME__MICE"],
        customIssues: [],
      })
      .respondWith({
        errors: [],
        session: { issues: ["HOME__MICE"], customIssuesV2: [] },
      });
    await pal.rt.waitForElement(() =>
      pal.rr.getByText("Apartment self-inspection")
    );
  });
});

test("getIssueLabel() works", () => {
  expect(getIssueLabel(0)).toBe("No issues reported");
  expect(getIssueLabel(1)).toBe("One issue reported");
  expect(getIssueLabel(2)).toBe("2 issues reported");
  expect(getIssueLabel(99)).toBe("99 issues reported");
});

test("issue area images exist", () => {
  IssueAreaChoices.forEach((area) => {
    const svg = ISSUE_AREA_SVGS[area];
    if (!svg) {
      throw new Error(`Expected ISSUE_AREA_SVGS.${area} to exist`);
    }
  });
});

test("groupByTwo() works", () => {
  expect(groupByTwo([1])).toEqual([[1, null]]);
  expect(groupByTwo([1, 2])).toEqual([[1, 2]]);
  expect(groupByTwo([1, 2, 3])).toEqual([
    [1, 2],
    [3, null],
  ]);
});
