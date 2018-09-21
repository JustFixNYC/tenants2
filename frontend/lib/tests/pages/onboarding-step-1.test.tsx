import React from 'react';

import OnboardingStep1, { areAddressesTheSame } from '../../pages/onboarding-step-1';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep1Mutation_output } from '../../queries/OnboardingStep1Mutation';


describe('onboarding step 1 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('calls onCancel when cancel is clicked', () => {
    const pal = new AppTesterPal(<OnboardingStep1/>);
    pal.clickButtonOrLink('Cancel signup');
    pal.expectGraphQL(/LogoutMutation/);
    pal.expectFormInput({});
  });

  it('has openable modals', () => {
    const pal = new AppTesterPal(<OnboardingStep1 />);
    pal.clickButtonOrLink(/Why do you need/i);
    pal.getDialogWithLabel(/Why do you need/i);
    pal.clickButtonOrLink("Got it!");
  });

  it('opens confirmation modal if address returned from server is different', async () => {
    const pal = new AppTesterPal(<OnboardingStep1 disableProgressiveEnhancement />);
    pal.fillFormFields([
      [/full name/i, 'boop jones'],
      [/address/i, '150 court'],
      [/borough/i, 'BROOKLYN'],
      [/apartment number/i, '2']
    ]);
    pal.clickButtonOrLink('Next');
    pal.respondWithFormOutput<OnboardingStep1Mutation_output>({
      errors: [],
      session: {
        onboardingStep1: {
          name: 'boop jones',
          address: '150 COURT STREET',
          borough: 'BROOKLYN',
          aptNumber: '2'
        }  
      }
    });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Is this your address/i));
  });
});

test('areAddressesTheSame() works', () => {
  expect(areAddressesTheSame('150 court street   ', '150 COURT STREET')).toBe(true);
  expect(areAddressesTheSame('150 court st   ', '150 COURT STREET')).toBe(false);
});
