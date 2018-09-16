import React from 'react';

import OnboardingStep4 from '../../pages/onboarding-step-4';
import { AppTesterPal } from '../app-tester-pal';


describe('onboarding step 4 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('displays welcome modal on successful signup', async () => {
    const pal = new AppTesterPal(<OnboardingStep4 />);

    pal.clickButtonOrLink("Create account");
    pal.respondWithFormOutput({ errors: [], session: {} });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Welcome/i));
  });
});
