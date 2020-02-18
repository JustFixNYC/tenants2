import React from 'react';

import OnboardingStep1 from '../onboarding-step-1';
import { AppTesterPal } from '../../tests/app-tester-pal';
import { OnboardingStep1Mutation_output } from '../../queries/OnboardingStep1Mutation';
import { createMockFetch } from '../../tests/mock-fetch';
import { FakeGeoResults, pauseForModalFocus } from '../../tests/util';
import Routes from '../../routes';

const PROPS = {
  routes: Routes.locale.onboarding,
  toCancel: '/cancel'
};

describe('onboarding step 1 page', () => {
  beforeEach(() => jest.clearAllTimers());
  afterEach(AppTesterPal.cleanup);

  it('calls onCancel when cancel is clicked (progressively enhanced experience)', () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    pal.clickButtonOrLink('Cancel signup');
    pal.expectGraphQL(/LogoutMutation/);
    pal.expectFormInput({});
  });

  it('calls onCancel when cancel is clicked (baseline experience)', () => {
    const pal = new AppTesterPal(<OnboardingStep1  {...PROPS} disableProgressiveEnhancement />);
    pal.clickButtonOrLink('Cancel signup');
    pal.expectGraphQL(/LogoutMutation/);
    pal.expectFormInput({});
  });

  it('has openable modals', async () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    pal.clickButtonOrLink(/Why do you need/i);
    pal.getDialogWithLabel(/Your privacy is very important/i);
    await pauseForModalFocus();
    pal.clickButtonOrLink("Got it!");
  });

  it('shows initial address and borough in autocomplete field', () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />, {
      session: {
        onboardingStep1: {
          firstName: 'boop',
          lastName: 'jones',
          aptNumber: '2',
          address: "150 DOOMBRINGER STREET",
          borough: "MANHATTAN",
          zipcode: "10000"
        }
      }
    });
    const input = pal.rr.getAllByLabelText(/address/i)[0] as HTMLInputElement;
    expect(input.value).toEqual('150 DOOMBRINGER STREET, Manhattan');
  });

  it('uses geo autocomplete in progressively enhanced experience', async () => {
    jest.useFakeTimers();
    const fetch = createMockFetch();
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    fetch.mockReturnJson(FakeGeoResults);
    pal.fillFormFields([
      [/first name/i, 'boop'],
      [/last name/i, 'jones'],
      [/apartment number/i, '2'],
      [/address/i, "150 cou"]
    ]);
    await fetch.resolvePromisesAndTimers();
    pal.clickListItem(/150 COURT STREET/);
    pal.clickButtonOrLink('Next');
    pal.expectFormInput({
      firstName: "boop",
      lastName: "jones",
      aptNumber: "2",
      address: "150 COURT STREET",
      borough: "MANHATTAN",
      zipcode: "11201"
    });
  });

  it('opens confirmation modal if address returned from server is different (baseline experience only)', async () => {
    jest.useRealTimers();
    const pal = new AppTesterPal(<OnboardingStep1  {...PROPS} disableProgressiveEnhancement />);
    pal.fillFormFields([
      [/first name/i, 'boop'],
      [/last name/i, 'jones'],
      [/address/i, '150 court'],
      [/apartment number/i, '2']
    ]);
    pal.clickRadioOrCheckbox(/Brooklyn/);
    pal.clickButtonOrLink('Next');
    pal.respondWithFormOutput<OnboardingStep1Mutation_output>({
      errors: [],
      session: {
        onboardingStep1: {
          firstName: 'boop',
          lastName: 'jones',
          address: '150 COURT STREET',
          borough: 'BROOKLYN',
          aptNumber: '2',
          zipcode: '11201'
        }  
      }
    });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Is this your address/i));
  });
});
