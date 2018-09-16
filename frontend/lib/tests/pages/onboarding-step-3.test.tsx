import React from 'react';

import OnboardingStep3, { LEASE_CHOICES, LEASE_MODALS } from '../../pages/onboarding-step-3';
import { validateDjangoChoices } from '../../common-data';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep3Mutation_output } from '../../queries/OnboardingStep3Mutation';


describe('onboarding step 3 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('displays modal when user chooses "rent stabilized"', async () => {
    const pal = new AppTesterPal(<OnboardingStep3 />);

    pal.click(/rent stabilized/i, 'label');
    pal.clickButtonOrLink('Next');
    pal.respondWithFormOutput<OnboardingStep3Mutation_output>({
      errors: [],
      session: {
        onboardingStep3: {
          leaseType: 'RENT_STABILIZED',
          receivesPublicAssistance: false
        }  
      }
    });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Great news/i));
  });
});

test('Lease types are valid', () => {
  validateDjangoChoices(LEASE_CHOICES, LEASE_MODALS.map(info => info.leaseType));
});
