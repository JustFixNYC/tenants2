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
        <Route path={Routes.hp.postOnboarding} render={() => <h1>HP ACTION</h1>} />
        <Route render={() => <p>NOT FOUND</p>} />
      </Switch>
    );

    pal.clickButtonOrLink(/create my account/i);
    pal.respondWithFormOutput({ errors: [], session: {
      onboardingInfo: { signupIntent: 'HP' }
    } });
    await pal.rt.waitForElement(() => pal.rr.getByText('HP ACTION'));
  });

  it('opens terms and conditions modal when link is clicked', async () => {
    const pal = new AppTesterPal(<OnboardingStep4 />);

    pal.clickButtonOrLink(/terms/i);
    pal.getDialogWithLabel(/terms/i);
  });
});
