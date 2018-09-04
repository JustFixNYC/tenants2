import React from 'react';

import OnboardingStep3, { OnboardingStep3Props, LeaseChoiceValues, LEASE_CHOICES } from '../../pages/onboarding-step-3';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';
import { validateDjangoChoices } from '../../common-data';
import { createTestGraphQlClient, FakeSessionInfo } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';


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

  it('displays modal when user chooses "rent stabilized"', async () => {
    const { client } = createTestGraphQlClient();
    const pal = ReactTestingLibraryPal.render(createOnboarding({ fetch: client.fetch }));

    pal.click(/rent stabilized/i, 'label');
    pal.clickButtonOrLink('Next');
    let session: AllSessionInfo = {
      ...FakeSessionInfo,
      onboardingStep3: {
        leaseType: LeaseChoiceValues.RENT_STABILIZED,
        receivesPublicAssistance: false
      }
    };
    client.getRequestQueue()[0].resolve({ onboardingStep3: { errors: [], session } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Great news/i));
  });
});

test('LeaseChoiceValues are valid', () => {
  validateDjangoChoices(LEASE_CHOICES, LeaseChoiceValues);
});
