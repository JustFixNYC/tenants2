import React from 'react';

import OnboardingStep3, { LEASE_CHOICES, LEASE_MODALS } from '../../pages/onboarding-step-3';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';
import { validateDjangoChoices } from '../../common-data';
import { createTestGraphQlClient, FakeSessionInfo, FakeAppContext } from '../util';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import { AppContextType, AppContext } from '../../app-context';


function createOnboarding(props: Partial<AppContextType> = {}): JSX.Element {
  const appCtx: AppContextType = {
    ...FakeAppContext,
    ...props
  };
  return (
    <MemoryRouter>
      <AppContext.Provider value={appCtx}>
        <OnboardingStep3 />
      </AppContext.Provider>
    </MemoryRouter>
  );
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
        leaseType: 'RENT_STABILIZED',
        receivesPublicAssistance: false
      }
    };
    client.getRequestQueue()[0].resolve({ output: { errors: [], session } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Great news/i));
  });
});

test('Lease types are valid', () => {
  validateDjangoChoices(LEASE_CHOICES, LEASE_MODALS.map(info => info.leaseType));
});
