import React from 'react';

import OnboardingStep3, { LEASE_CHOICES } from '../../pages/onboarding-step-3';
import { validateDjangoChoices, getDjangoChoiceLabel } from '../../common-data';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep3Mutation_output } from '../../queries/OnboardingStep3Mutation';
import { escapeRegExp } from '../util';
import Routes from '../../routes';


const PROPS = {
  routes: Routes.onboarding
};

const STEP_3 = new OnboardingStep3(PROPS);

describe('onboarding step 3 page', () => {
  afterEach(AppTesterPal.cleanup);

  STEP_3.leaseLearnMoreModals.forEach(info => {
    const { leaseType } = info;
    const label = getDjangoChoiceLabel(LEASE_CHOICES, leaseType);

    it(`displays learn more modal for ${label}`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 {...PROPS} />);

      pal.clickButtonOrLink(`Learn more about ${label} leases`);
      await pal.rt.waitForElement(() => pal.getDialogWithLabel(/.+/i));
    });
  });

  STEP_3.leaseModals.forEach(info => {
    const { leaseType } = info;
    const label = getDjangoChoiceLabel(LEASE_CHOICES, leaseType);

    it(`displays modal when user chooses "${label}"`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 {...PROPS} />);

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
  validateDjangoChoices(LEASE_CHOICES, STEP_3.allLeaseModals.map(info => info.leaseType));
});
