import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import {
  signupIntentFromOnboardingInfo,
  DEFAULT_SIGNUP_INTENT_CHOICE,
  getOnboardingRouteForIntent,
  getPostOnboardingURL,
} from "../signup-intent";
import { AppTesterPal } from "../../tests/app-tester-pal";

test("signupIntentFromOnboardingInfo() works", () => {
  expect(signupIntentFromOnboardingInfo(null)).toStrictEqual(
    DEFAULT_SIGNUP_INTENT_CHOICE
  );
  expect(signupIntentFromOnboardingInfo({ signupIntent: "boop" } as any)).toBe(
    "boop"
  );
});

describe("getOnboardingRouteForIntent()", () => {
  afterEach(AppTesterPal.cleanup);

  it("works", async () => {
    const pal = new AppTesterPal(
      getOnboardingRouteForIntent(OnboardingInfoSignupIntent.LOC),
      {
        url: "/en/onboarding/step/4",
      }
    );
    const input = await pal.rt.waitForElement(() =>
      pal.getElement("input", '[name="signupIntent"]')
    );
    expect(input && input.value).toBe("LOC");
  });
});

describe("getPostOnboardingURL()", () => {
  it("returns a default if no onboarding information is available", () => {
    expect(getPostOnboardingURL(null)).toBe("/en/loc");
  });

  it("returns the current signup intent's post-onboarding URL if possible", () => {
    expect(
      getPostOnboardingURL({ signupIntent: OnboardingInfoSignupIntent.HP })
    ).toBe("/en/hp");
  });
});
