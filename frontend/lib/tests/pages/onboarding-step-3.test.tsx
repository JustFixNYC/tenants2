import React from 'react';

import OnboardingStep3 from '../../pages/onboarding-step-3';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep3Mutation_output } from '../../queries/OnboardingStep3Mutation';
import { escapeRegExp } from '../util';
import Routes from '../../routes';
import { getLeaseChoiceLabels } from '../../../../common-data/lease-choices';


const PROPS = {
  routes: Routes.locale.onboarding
};

const STEP_3 = new OnboardingStep3(PROPS);

describe('onboarding step 3 page', () => {
  afterEach(AppTesterPal.cleanup);

  const labels = getLeaseChoiceLabels();

  STEP_3.leaseLearnMoreModals.forEach(info => {
    const { leaseType } = info;
    const label = labels[leaseType];

    it(`displays learn more modal for ${label}`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 {...PROPS} />);

      pal.clickButtonOrLink(`Learn more about ${label} leases`);
      await pal.rt.waitForElement(() => pal.getDialogWithLabel(/.+/i));
    });
  });

  STEP_3.leaseModals.forEach(info => {
    const { leaseType } = info;
    const label = labels[leaseType];

    it(`displays modal when user chooses "${label}"`, async () => {
      const pal = new AppTesterPal(<OnboardingStep3 {...PROPS} />);

      pal.clickRadioOrCheckbox(new RegExp('^' + escapeRegExp(label)));
      pal.clickButtonOrLink('Next');
      pal.respondWithFormOutput<OnboardingStep3Mutation_output>({
        errors: [],
        session: {
          onboardingStep3: {
            leaseType,
            receivesPublicAssistance: 'False'
          }
        }
      });
      await pal.rt.waitForElement(() => pal.getDialogWithLabel(/.+/i));
    });
  });
});
