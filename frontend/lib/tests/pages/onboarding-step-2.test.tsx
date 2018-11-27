import React from 'react';

import OnboardingStep2 from '../../pages/onboarding-step-2';
import { AppTesterPal } from '../app-tester-pal';
import Routes from '../../routes';


describe('onboarding step 2 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('opens eviction modal', () => {
    const pal = new AppTesterPal(<OnboardingStep2 routes={Routes.onboarding} />);
    const getDialog = () => pal.getDialogWithLabel(/You need legal help/i);

    // When we enable the checkbox, the dialog should show.
    pal.clickRadioOrCheckbox(/I received an eviction notice/i);
    getDialog();
    pal.clickButtonOrLink("Continue with letter");
  });
});
