import { FakeSessionInfo } from "./util";
import { getLatestOnboardingStep, RedirectToLatestOnboardingStep } from "../onboarding";
import Routes from "../routes";
import { Redirect } from "react-router";

describe('getLatestOnboardingStep()', () => {
  it('returns step 1 by default', () => {
    expect(getLatestOnboardingStep(FakeSessionInfo)).toBe(Routes.onboarding.step1);
  });

  it('returns step 2 when step 1 is complete', () => {
    expect(getLatestOnboardingStep({
      ...FakeSessionInfo,
      onboardingStep1: {} as any
    })).toBe(Routes.onboarding.step2);
  });
});

test('RedirectToLatestOnboardingStep returns a redirect', () => {
  const result = RedirectToLatestOnboardingStep({ session: FakeSessionInfo });
  expect(result.type).toBe(Redirect);
});
