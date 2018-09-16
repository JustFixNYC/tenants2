import React from 'react';

import OnboardingStep2 from '../../pages/onboarding-step-2';
import { AppTesterPal } from '../app-tester-pal';


describe('onboarding step 2 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('opens eviction modal', () => {
    const pal = new AppTesterPal(<OnboardingStep2 />);
    const getDialog = () => pal.getDialogWithLabel(/You need legal help/i);

    // When we enable the checkbox, the dialog should show.
    pal.click(/eviction/i, 'label');
    getDialog();
    pal.clickButtonOrLink("Continue with letter");

    // Disabling the checkbox should *not* show the dialog.
    pal.click(/eviction/i, 'label');
    expect(getDialog).toThrow();
  });
});
