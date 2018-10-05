import React from 'react';

import OnboardingStep4 from '../../pages/onboarding-step-4';
import { AppTesterPal } from '../app-tester-pal';
import { Switch, Route } from 'react-router';
import Routes from '../../routes';


describe('onboarding step 4 page', () => {
  afterEach(AppTesterPal.cleanup);

  it('redirects on successful signup', async () => {
    const pal = new AppTesterPal(
      <Switch>
        <Route path="/" exact component={OnboardingStep4} />
        <Route path={Routes.loc.home} render={() => <h1>LETTER OF COMPLAINT</h1>} />
      </Switch>
    );

    pal.clickButtonOrLink(/finish/i);
    pal.respondWithFormOutput({ errors: [], session: {} });
    await pal.rt.waitForElement(() => pal.rr.getByText('LETTER OF COMPLAINT'));
  });

  it('opens terms and conditions modal when link is clicked', async () => {
    const pal = new AppTesterPal(<OnboardingStep4 />);

    pal.clickButtonOrLink(/terms/i);
    pal.getDialogWithLabel(/terms/i);
  });
});
