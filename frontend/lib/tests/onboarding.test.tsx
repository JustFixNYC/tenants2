import React from 'react';

import { FakeSessionInfo, ensureRedirect } from "./util";
import { RedirectToLatestOnboardingStep, onboardingSteps } from "../onboarding";
import Routes from "../routes";
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { getLatestStep } from '../progress-redirection';

describe('latest step redirector', () => {
  function getLatestOnboardingStep(session: AllSessionInfo): string {
    return getLatestStep(session, onboardingSteps);
  }

  it('returns step 1 by default', () => {
    expect(getLatestOnboardingStep(FakeSessionInfo)).toBe(Routes.onboarding.step1);
  });

  it('returns step 2 when step 1 is complete', () => {
    expect(getLatestOnboardingStep({
      ...FakeSessionInfo,
      onboardingStep1: {} as any
    })).toBe(Routes.onboarding.step2);
  });

  it('returns step 3 when step 2 is complete', () => {
    expect(getLatestOnboardingStep({
      ...FakeSessionInfo,
      onboardingStep1: {} as any,
      onboardingStep2: {} as any
    })).toBe(Routes.onboarding.step3);
  });

  it('returns step 4 when step 3 is complete', () => {
    expect(getLatestOnboardingStep({
      ...FakeSessionInfo,
      onboardingStep1: {} as any,
      onboardingStep2: {} as any,
      onboardingStep3: {} as any
    })).toBe(Routes.onboarding.step4);
  });
});

test('RedirectToLatestOnboardingStep returns a redirect', () => {
  ensureRedirect(<RedirectToLatestOnboardingStep />, '/onboarding/step/1');
});
