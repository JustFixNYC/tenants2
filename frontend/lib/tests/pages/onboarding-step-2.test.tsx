import React from 'react';

import OnboardingStep2, { OnboardingStep2Props } from '../../pages/onboarding-step-2';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';


function createOnboarding(props: Partial<OnboardingStep2Props> = {}): JSX.Element {
  const finalProps: OnboardingStep2Props = {
    fetch: jest.fn(),
    onSuccess: jest.fn(),
    ...props
  };
  return (<MemoryRouter><OnboardingStep2 {...finalProps} /></MemoryRouter>);
}

describe('onboarding step 2 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('opens eviction modal', () => {
    const pal = ReactTestingLibraryPal.render(createOnboarding());

    pal.click(/eviction/i, 'label');
    pal.getDialogWithLabel(/You need legal help/i);
    pal.clickButtonOrLink("Continue with letter");
  });
});
