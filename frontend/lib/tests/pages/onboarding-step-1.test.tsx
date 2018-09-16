import React from 'react';

import OnboardingStep1, { areAddressesTheSame, OnboardingStep1Props } from '../../pages/onboarding-step-1';
import { MemoryRouter } from 'react-router';
import { FakeSessionInfo, createTestGraphQlClient } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import ReactTestingLibraryPal from '../rtl-pal';


function createOnboarding(props: Partial<OnboardingStep1Props> = {}): JSX.Element {
  const finalProps: OnboardingStep1Props = {
    fetch: jest.fn(),
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    ...props
  };
  return (<MemoryRouter><OnboardingStep1 {...finalProps} /></MemoryRouter>);
}

describe('onboarding step 1 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = jest.fn();
    const pal = new ReactTestingLibraryPal(createOnboarding({ onCancel }));
    expect(onCancel.mock.calls).toHaveLength(0);
    pal.clickButtonOrLink("Cancel");
    expect(onCancel.mock.calls).toHaveLength(1);
  });

  it('has openable modals', () => {
    const pal = new ReactTestingLibraryPal(createOnboarding());
    pal.clickButtonOrLink(/Why do you need/i);
    pal.getDialogWithLabel(/Why do you need/i);
    pal.clickButtonOrLink("Got it!");
  });

  it('opens confirmation modal if address returned from server is different', async () => {
    const { client } = createTestGraphQlClient();
    const pal = new ReactTestingLibraryPal(createOnboarding({ fetch: client.fetch }));
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
    client.getRequestQueue()[0].resolve({ output: { errors: [], session } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Is this your address/i));
  });
});

test('areAddressesTheSame() works', () => {
  expect(areAddressesTheSame('150 court street   ', '150 COURT STREET')).toBe(true);
  expect(areAddressesTheSame('150 court st   ', '150 COURT STREET')).toBe(false);
});
