import React from 'react';

import OnboardingStep3, { OnboardingStep3Props } from '../../pages/onboarding-step-3';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';


function createOnboarding(props: Partial<OnboardingStep3Props> = {}): JSX.Element {
  const finalProps: OnboardingStep3Props = {
    fetch: jest.fn(),
    onSuccess: jest.fn(),
    ...props
  };
  return (<MemoryRouter><OnboardingStep3 {...finalProps} /></MemoryRouter>);
}

describe('onboarding step 3 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('has clickable form fields', () => {
    const pal = ReactTestingLibraryPal.render(createOnboarding());

    pal.click(/market rate/i, 'label');
    pal.click(/public assistance/i, 'label');
  });
});
