import React from 'react';

import OnboardingStep1, { areAddressesTheSame } from '../../pages/onboarding-step-1';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep1Mutation_output } from '../../queries/OnboardingStep1Mutation';
import { createMockFetch } from '../mock-fetch';
import { FakeGeoResults } from '../util';


describe('onboarding step 1 page', () => {
  beforeEach(() => jest.clearAllTimers());
  afterEach(AppTesterPal.cleanup);

  it('calls onCancel when cancel is clicked (progressively enhanced experience)', () => {
    const pal = new AppTesterPal(<OnboardingStep1/>);
    pal.clickButtonOrLink('Cancel signup');
    pal.expectGraphQL(/LogoutMutation/);
    pal.expectFormInput({});
  });

  it('calls onCancel when cancel is clicked (baseline experience)', () => {
    const pal = new AppTesterPal(<OnboardingStep1 disableProgressiveEnhancement />);
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

  it('uses geo autocomplete in progressively enhanced experience', async () => {
    jest.useFakeTimers();
    const fetch = createMockFetch();
    const pal = new AppTesterPal(<OnboardingStep1 />);
    fetch.mockReturnJson(FakeGeoResults);
    pal.fillFormFields([
      [/full name/i, 'boop jones'],
      [/apartment number/i, '2'],
      [/address/i, "150 cou"]
    ]);
    await fetch.resolvePromisesAndTimers();
    pal.clickListItem(/150 COURT STREET/);
    pal.clickButtonOrLink('Next');
    pal.expectFormInput({
      name: "boop jones",
      aptNumber: "2",
      address: "150 COURT STREET",
      borough: "MANHATTAN"
    });
  });

  it('opens confirmation modal if address returned from server is different (baseline experience only)', async () => {
    jest.useRealTimers();
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
