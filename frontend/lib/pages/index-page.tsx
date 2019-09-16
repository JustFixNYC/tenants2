import React from 'react';

import { Redirect } from 'react-router-dom';
import { getSignupIntentOnboardingInfo } from '../routes';
import { AppContext } from '../app-context';
import { signupIntentFromOnboardingInfo } from '../signup-intent';
import { LocSplash } from '../letter-of-complaint-splash';

export interface IndexPageProps {
  isLoggedIn: boolean;
}

export default class IndexPage extends React.Component<IndexPageProps> {
  renderLoggedIn() {
    return (
      <AppContext.Consumer>
        {(ctx) => (
          <Redirect to={getSignupIntentOnboardingInfo(
            signupIntentFromOnboardingInfo(ctx.session.onboardingInfo)
          ).postOnboarding} />
        )}
      </AppContext.Consumer>
    );
  }

  render() {
    if (this.props.isLoggedIn) {
      return this.renderLoggedIn();
    } else {
      return <LocSplash />;
    }
  }
}
