import React from 'react';

import OnboardingStep4 from '../../pages/onboarding-step-4';
import { MemoryRouter } from 'react-router';
import ReactTestingLibraryPal from '../rtl-pal';
import { createTestGraphQlClient, FakeAppContext } from '../util';
import { AppContext, AppContextType } from '../../app-context';


function createOnboarding(props: Partial<AppContextType> = {}): JSX.Element {
  const appCtx: AppContextType = {
    ...FakeAppContext,
    ...props
  };
  return (
    <MemoryRouter>
      <AppContext.Provider value={appCtx}>
        <OnboardingStep4 />
      </AppContext.Provider>
    </MemoryRouter>
  );
}

describe('onboarding step 2 page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('displays welcome modal on successful signup', async () => {
    const { client } = createTestGraphQlClient();
    const pal = ReactTestingLibraryPal.render(createOnboarding({ fetch: client.fetch }));

    pal.clickButtonOrLink("Create account");
    client.getRequestQueue()[0].resolve({ output: { errors: [], session: {} } });
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/Welcome/i));
  });
});
