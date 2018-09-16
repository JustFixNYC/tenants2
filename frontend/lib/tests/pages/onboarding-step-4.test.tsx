import React from 'react';

import OnboardingStep4 from '../../pages/onboarding-step-4';
import { AppTester } from '../app-tester';


describe('onboarding step 2 page', () => {
  afterEach(AppTester.cleanup);

  it('displays welcome modal on successful signup', async () => {
    const t = new AppTester(<OnboardingStep4 />);

    t.pal.clickButtonOrLink("Create account");
    t.respondWithFormOutput({ errors: [], session: {} });
    await t.pal.rt.waitForElement(() => t.pal.getDialogWithLabel(/Welcome/i));
  });
});
