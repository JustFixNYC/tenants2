import React from 'react';

import * as rt from 'react-testing-library'

import OnboardingStep1 from '../../pages/onboarding-step-1';
import { MemoryRouter } from 'react-router';


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
    const closeBtn = thing.getByLabelText("close");
    rt.fireEvent.click(closeBtn);
  });
});
