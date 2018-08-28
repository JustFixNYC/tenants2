import React from 'react';
import { shallowWithRouter } from '../util';
import OnboardingStep1 from '../../pages/onboarding-step-1';


describe('onboarding step 1 page', () => {
  it('renders', () => {
    const { wrapper } = shallowWithRouter(
      <OnboardingStep1 fetch={jest.fn()} onSuccess={jest.fn()} />
    );
    expect(wrapper.html()).toContain('Tell us about yourself!');
  });
});
