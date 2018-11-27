import React from 'react';

import { FakeSessionInfo, ensureRedirect } from "./util";
import OnboardingRoutes, { RedirectToLatestOnboardingStep, onboardingSteps } from "../onboarding";
import Routes from "../routes";
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { getLatestStep } from '../progress-redirection';
import { AppTesterPal } from './app-tester-pal';
import { OnboardingInfoSignupIntent } from '../queries/globalTypes';

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

describe('Onboarding for intent route', () => {
  afterEach(AppTesterPal.cleanup);

  it('works when user has no existing session', () => {
    const pal = new AppTesterPal(<OnboardingRoutes/>, {
      url: Routes.onboarding.forIntent.create(OnboardingInfoSignupIntent.HP)
    });
    expect(pal.history.location.pathname).toEqual('/onboarding/step/1');
    expect(pal.history.location.search).toEqual('?intent=hp');
    pal.rr.getByLabelText('First name');
  });

  it('works when user is already onboarding for the given intent', () => {
    const pal = new AppTesterPal(<OnboardingRoutes/>, {
      url: Routes.onboarding.forIntent.create(OnboardingInfoSignupIntent.HP),
      session: { onboardingStep1: { signupIntent: 'HP' } as any }
    });
    expect(pal.history.location.pathname).toEqual('/onboarding/step/2');
  });
});
