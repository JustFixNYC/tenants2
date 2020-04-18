import Routes, { getSignupIntentOnboardingInfo } from "../routes";
import { OnboardingInfoSignupIntent, Borough } from "../queries/globalTypes";
import i18n from "../i18n";

test("Routes object responds to locale changes", () => {
  expect(Routes.locale.home).toBe("/");
  i18n.initialize("en");
  expect(Routes.locale.home).toBe("/en/");
  i18n.initialize("");
  expect(Routes.locale.home).toBe("/");
});

describe("getSignupIntentRouteInfo", () => {
  it("returns an object for all choices", () => {
    for (let choice in OnboardingInfoSignupIntent) {
      expect(
        getSignupIntentOnboardingInfo(choice as OnboardingInfoSignupIntent)
      ).not.toBeUndefined();
    }
  });
});

describe("Routes.locale.homeWithSearch()", () => {
  it("works", () => {
    expect(
      Routes.locale.homeWithSearch({
        address: "654 park place",
        borough: Borough.BROOKLYN,
      })
    ).toBe("/?address=654%20park%20place&borough=BROOKLYN");
  });

  it("Returns home when not enough onboarding info is available", () => {
    expect(Routes.locale.homeWithSearch(null)).toBe("/");
    expect(
      Routes.locale.homeWithSearch({ address: "blarg", borough: null })
    ).toBe("/");
  });
});
