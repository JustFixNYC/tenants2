import React from 'react';

import OnboardingStep2 from '../onboarding-step-2';
import { AppTesterPal } from '../../tests/app-tester-pal';
import Routes from '../../routes';
import { pauseForModalFocus } from '../../tests/util';


describe('onboarding step 2 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('opens eviction modal', async () => {
    const pal = new AppTesterPal(<OnboardingStep2 routes={Routes.locale.onboarding} />);
    const getDialog = () => pal.getDialogWithLabel(/Eviction cases are currently halted/i);

    // When we enable the checkbox, the dialog should show.
    pal.clickRadioOrCheckbox(/I received an eviction notice/i);
    getDialog();
    await pauseForModalFocus();
    pal.clickButtonOrLink("Continue with letter");
  });
});
