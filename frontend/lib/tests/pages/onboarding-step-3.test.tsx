import React from 'react';

import OnboardingStep3, { LEASE_CHOICES, LEASE_MODALS, ALL_LEASE_MODALS, LEASE_LEARN_MORE_MODALS } from '../../pages/onboarding-step-3';
import { validateDjangoChoices, getDjangoChoiceLabel } from '../../common-data';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep3Mutation_output } from '../../queries/OnboardingStep3Mutation';
import { escapeRegExp } from '../util';



describe('onboarding step 3 page', () => {
  afterEach(AppTesterPal.cleanup);

  LEASE_LEARN_MORE_MODALS.forEach(info => {
    const { leaseType } = info;
    const label = getDjangoChoiceLabel(LEASE_CHOICES, leaseType);

    it(`displays learn more modal for ${label}`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 />);

      pal.clickButtonOrLink(`Learn more about ${label} leases`);
      await pal.rt.waitForElement(() => pal.getDialogWithLabel(/.+/i));
    });
  });

  LEASE_MODALS.forEach(info => {
    const { leaseType } = info;
    const label = getDjangoChoiceLabel(LEASE_CHOICES, leaseType);

    it(`displays modal when user chooses "${label}"`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 />);

      pal.clickRadioOrCheckbox(new RegExp('^' + escapeRegExp(label)));
      pal.clickButtonOrLink('Next');
      pal.respondWithFormOutput<OnboardingStep3Mutation_output>({
        errors: [],
        session: {
          onboardingStep3: {
            leaseType,
            receivesPublicAssistance: false
          }
        }
      });
      await pal.rt.waitForElement(() => pal.getDialogWithLabel(/.+/i));
    });
  });
});

test('Lease types are valid', () => {
  validateDjangoChoices(LEASE_CHOICES, ALL_LEASE_MODALS.map(info => info.leaseType));
});
