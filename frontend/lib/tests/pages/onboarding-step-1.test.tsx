import React from 'react';

import * as rt from 'react-testing-library'

import OnboardingStep1, { areAddressesTheSame } from '../../pages/onboarding-step-1';
import { MemoryRouter } from 'react-router';
import { FakeSessionInfo, createTestGraphQlClient } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';


function clickButtonOrLink(rr: rt.RenderResult, matcher: RegExp|string) {
  rt.fireEvent.click(rr.getByText(matcher, {
    selector: 'a, button'
  }));
}

type FormFieldFill = [RegExp, string];

function fillFormFields(rr: rt.RenderResult, fills: FormFieldFill[]) {
  fills.forEach(([matcher, value]) => {
    const input = rr.getByLabelText(matcher, {
      selector: 'input, select'
    }) as HTMLInputElement;
    input.value = value;
  });
}

function getDialogWithLabel(rr: rt.RenderResult, matcher: RegExp|string): HTMLDivElement {
  return rr.getByLabelText(matcher, {
    selector: 'div[role="dialog"]'
  }) as HTMLDivElement;
}

describe('onboarding step 1 page', () => {
  afterEach(rt.cleanup);

  it('has openable modals', () => {
    const thing = rt.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={jest.fn()} onSuccess={jest.fn()} />
      </MemoryRouter>
    );

    clickButtonOrLink(thing, /Why do you need/i);
    getDialogWithLabel(thing, /Why do you need/i);
    clickButtonOrLink(thing, "Got it!");
  });

  it('opens confirmation modal if address returned from server is different', async () => {
    const { client } = createTestGraphQlClient();
    const thing = rt.render(
      <MemoryRouter>
        <OnboardingStep1 fetch={client.fetch} onSuccess={jest.fn()} />
      </MemoryRouter>
    );

    fillFormFields(thing, [
      [/full name/i, 'boop jones'],
      [/address/i, '150 court'],
      [/borough/i, 'BROOKLYN'],
      [/apartment number/i, '2']
    ]);
    clickButtonOrLink(thing, 'Next');

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
    await rt.waitForElement(() => getDialogWithLabel(thing, /Is this your address/i));
  });
});

test('areAddressesTheSame() works', () => {
  expect(areAddressesTheSame('150 court street   ', '150 COURT STREET')).toBe(true);
  expect(areAddressesTheSame('150 court st   ', '150 COURT STREET')).toBe(false);
});
