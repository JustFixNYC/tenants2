import React from 'react';

import OnboardingStep4, { OnboardingStep4Props } from '../../pages/onboarding-step-4';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';
import { createTestGraphQlClient } from '../util';


function createOnboarding(props: Partial<OnboardingStep4Props> = {}): JSX.Element {
  const finalProps: OnboardingStep4Props = {
    fetch: jest.fn(),
    onSuccess: jest.fn(),
    ...props
  };
  return (<MemoryRouter><OnboardingStep4 {...finalProps} /></MemoryRouter>);
}

describe('onboarding step 2 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('displays welcome modal on successful signup', async () => {
    const { client } = createTestGraphQlClient();
    const pal = ReactTestingLibraryPal.render(createOnboarding({ fetch: client.fetch }));

    pal.clickButtonOrLink("Create account");
    client.getRequestQueue()[0].resolve({ onboardingStep4: { errors: [], session: {} } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Welcome/i));
  });
});
