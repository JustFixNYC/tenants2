import { parse as parseUrl } from 'url';
import React from 'react';

import OnboardingStep1, { areAddressesTheSame, getIntent } from '../../pages/onboarding-step-1';
import { AppTesterPal } from '../app-tester-pal';
import { OnboardingStep1Mutation_output } from '../../queries/OnboardingStep1Mutation';
import { createMockFetch } from '../mock-fetch';
import { FakeGeoResults } from '../util';
import Routes from '../../routes';
import { assertNotUndefined } from '../../util';
import { OnboardingInfoSignupIntent } from '../../queries/globalTypes';


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
    pal.getDialogWithLabel(/Your privacy is very important/i);
    pal.clickButtonOrLink("Got it!");
  });

  it('shows initial address and borough in autocomplete field', () => {
    const pal = new AppTesterPal(<OnboardingStep1 />, {
      session: {
        onboardingStep1: {
          firstName: 'boop',
          lastName: 'jones',
          signupIntent: 'LOC',
          aptNumber: '2',
          address: "150 DOOMBRINGER STREET",
          borough: "MANHATTAN"
        }
      }
    });
    const input = pal.rr.getByLabelText(/address/i) as HTMLInputElement;
    expect(input.value).toEqual('150 DOOMBRINGER STREET, Manhattan');
  });

  it('uses geo autocomplete in progressively enhanced experience', async () => {
    jest.useFakeTimers();
    const fetch = createMockFetch();
    const pal = new AppTesterPal(<OnboardingStep1 />);
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
      signupIntent: 'LOC',
      aptNumber: "2",
      address: "150 COURT STREET",
      borough: "MANHATTAN"
    });
  });

  it('opens confirmation modal if address returned from server is different (baseline experience only)', async () => {
    jest.useRealTimers();
    const pal = new AppTesterPal(<OnboardingStep1 disableProgressiveEnhancement />);
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
          signupIntent: 'LOC',
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

describe('getIntent()', () => {
  it("Works with routes we generate", () => {
    const route = Routes.onboarding.createStep1WithIntent(OnboardingInfoSignupIntent.HP);
    const url = assertNotUndefined(parseUrl(route).search);
    expect(getIntent(undefined, url)).toEqual('HP');
  });

  it("Falls back if nothing valid is specified in session or querystring", () => {
    expect(getIntent(undefined, '')).toEqual('LOC');
    expect(getIntent(undefined, '?intent=booooop')).toEqual('LOC');
  });

  it("Falls back to the session value if querystring value is invalid/nonexistent", () => {
    expect(getIntent('HP', '?intent=booooop')).toEqual('HP');
    expect(getIntent('HP', '')).toEqual('HP');
  });

  it("Prefers valid querystring value over anything else", () => {
    expect(getIntent(undefined, '?intent=hp')).toEqual('HP');
    expect(getIntent('HP', '?intent=loc')).toEqual('LOC');
  });
});
