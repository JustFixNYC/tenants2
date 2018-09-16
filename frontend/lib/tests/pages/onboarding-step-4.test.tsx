import React from 'react';

import OnboardingStep4 from '../../pages/onboarding-step-4';
import { AppTester } from '../app-tester';


describe('onboarding step 2 page', () => {
  afterEach(AppTester.cleanup);

  it('displays welcome modal on successful signup', async () => {
    const { pal, client } = new AppTester(<OnboardingStep4 />);

    pal.clickButtonOrLink("Create account");
    client.getRequestQueue()[0].resolve({ output: { errors: [], session: {} } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Welcome/i));
  });
});
