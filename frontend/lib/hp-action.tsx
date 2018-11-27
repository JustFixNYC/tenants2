import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { OnboardingInfoSignupIntent } from './queries/globalTypes';
import { Route, Switch } from 'react-router-dom';
import { CenteredPrimaryButtonLink } from './buttons';

const onboardingForHPActionRoute = Routes.onboarding.forIntent.create(OnboardingInfoSignupIntent.HP);

function HPActionPreOnboarding(): JSX.Element {
  return (
    <Page title="HP action landing page" className="content">
      <h1>HP action landing page</h1>
      <p>This page will eventually include information on why you should sign up with JustFix to start an HP action.</p>
      <CenteredPrimaryButtonLink className="is-large" to={onboardingForHPActionRoute}>
        Start my free HP action
      </CenteredPrimaryButtonLink>
    </Page>
  );
}

function HPActionPostOnboarding(): JSX.Element {
  return (
    <Page title="HP Action" className="content">
      <h1>HP action</h1>
      <p>This page will eventually include introductory information about starting an HP Action.</p>
    </Page>
  );
}

export default function HPActionRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.hp.preOnboarding} exact component={HPActionPreOnboarding} />
      <Route path={Routes.hp.postOnboarding} exact component={HPActionPostOnboarding} />
    </Switch>
  );
}
