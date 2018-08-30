import React from 'react';

import OnboardingStep1, { areAddressesTheSame } from '../../pages/onboarding-step-1';
import { MemoryRouter } from 'react-router';
import { FakeSessionInfo, createTestGraphQlClient } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import ReactTestingLibraryPal from '../rtl-pal';


describe('onboarding step 1 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('has openable modals', () => {
    const pal = ReactTestingLibraryPal.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={jest.fn()} onSuccess={jest.fn()} />
      </MemoryRouter>
    );
    pal.clickButtonOrLink(/Why do you need/i);
    pal.getDialogWithLabel(/Why do you need/i);
    pal.clickButtonOrLink("Got it!");
  });

  it('opens confirmation modal if address returned from server is different', async () => {
    const { client } = createTestGraphQlClient();
    const pal = ReactTestingLibraryPal.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={client.fetch} onSuccess={jest.fn()} />
      </MemoryRouter>
    );
    pal.fillFormFields([
      [/full name/i, 'boop jones'],
      [/address/i, '150 court'],
      [/borough/i, 'BROOKLYN'],
      [/apartment number/i, '2']
    ]);
    pal.clickButtonOrLink('Next');
    let session: AllSessionInfo = {
      ...FakeSessionInfo,
      onboardingStep1: {
        name: 'boop jones',
        address: '150 COURT STREET',
        borough: 'BROOKLYN',
        aptNumber: '2'
      }
    };
    client.getRequestQueue()[0].resolve({ onboardingStep1: { errors: [], session } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Is this your address/i));
  });
});

test('areAddressesTheSame() works', () => {
  expect(areAddressesTheSame('150 court street   ', '150 COURT STREET')).toBe(true);
  expect(areAddressesTheSame('150 court st   ', '150 COURT STREET')).toBe(false);
});
