import React from 'react';

import * as rt from 'react-testing-library'

import OnboardingStep1, { areAddressesTheSame } from '../../pages/onboarding-step-1';
import { MemoryRouter } from 'react-router';
import { createTestGraphQlClient, FakeSessionInfo } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';


describe('onboarding step 1 page', () => {
  afterEach(rt.cleanup);

  it('has openable modals', () => {
    const thing = rt.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={jest.fn()} onSuccess={jest.fn()} />
      </MemoryRouter>
    );

    const link = thing.getByText(/Why do you need/i, { selector: 'a' });
    rt.fireEvent.click(link);
    expect(thing.getByLabelText(/Why do you need/i, {
      selector: 'div[role="dialog"]'
    })).toBeTruthy();
    const closeBtn = thing.getByText("Got it!");
    rt.fireEvent.click(closeBtn);
  });

  it('opens confirmation modal if address returned from server is different', async () => {
    const onSuccess = jest.fn();
    const resolvers: Function[] = [];
    const fetch = () => new Promise((resolve, reject) => resolvers.push(resolve));
    const thing = rt.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={fetch} onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const setField = (matcher: RegExp, value: string) => {
      const input = thing.getByLabelText(matcher, { selector: 'input, select' }) as HTMLInputElement;
      input.value = value;
    };
    setField(/full name/i, 'boop jones');
    setField(/address/i, '150 court');
    setField(/borough/i, 'BROOKLYN');
    setField(/apartment number/i, '2');
    rt.fireEvent.click(thing.getByText('Next'));
    expect(resolvers).toHaveLength(1);
    let session: AllSessionInfo = {
      ...FakeSessionInfo,
      onboardingStep1: {
        name: 'boop jones',
        address: '150 COURT STREET',
        borough: 'BROOKLYN',
        aptNumber: '2'
      }
    };
    resolvers[0]({ onboardingStep1: { errors: [], session } });
    await rt.waitForElement(() => thing.getByLabelText(/Is this your address/i, {
      selector: 'div[role="dialog"]'
    }));
  });
});

test('areAddressesTheSame() works', () => {
  expect(areAddressesTheSame('150 court street   ', '150 COURT STREET')).toBe(true);
  expect(areAddressesTheSame('150 court st   ', '150 COURT STREET')).toBe(false);
});
