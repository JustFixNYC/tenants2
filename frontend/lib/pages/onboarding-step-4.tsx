import React from 'react';
import { OnboardingStep4Input } from "../queries/globalTypes";
import Page from '../page';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import autobind from 'autobind-decorator';
import { OnboardingStep4Mutation } from '../queries/OnboardingStep4Mutation';
import { Route } from 'react-router-dom';
import Routes from '../routes';
import { NextButton, BackButton } from "../buttons";
import { CheckboxFormField, TextualFormField } from '../form-fields';
import { Modal } from '../modal';
import { WelcomeFragment } from '../letter-of-complaint-common';

const blankInitialState: OnboardingStep4Input = {
  phoneNumber: '',
  canWeSms: true,
  password: '',
  confirmPassword: '',
  agreeToTerms: false
};

export function Step4WelcomeModal(): JSX.Element {
  return (
    <Modal title="Welcome!" onCloseGoTo={Routes.home}>
      <div className="content box">
        <WelcomeFragment />
      </div>
    </Modal>
  );
}

export default class OnboardingStep4 extends React.Component {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField label="Phone number" type="tel" {...ctx.fieldPropsFor('phoneNumber')} />
        <CheckboxFormField {...ctx.fieldPropsFor('canWeSms')}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('agreeToTerms')}>
          I agree to the JustFix terms and conditions, which are currently unspecified.
        </CheckboxFormField>
        <p>
          You can optionally create a password-protected account now, which will allow you to securely log in and check your progress.
        </p>
        <br/>
        <TextualFormField label="Create a password (optional)" type="password" {...ctx.fieldPropsFor('password')} />
        <TextualFormField label="Please confirm your password (optional)" type="password" {...ctx.fieldPropsFor('confirmPassword')} />
        <div className="buttons">
          <BackButton to={Routes.onboarding.step3} label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Finish" />
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="Last step! Let's create your account.">
        <h1 className="title">Last step!</h1>
        <p>
          We just need a way to follow-up with you.
        </p>
        <br/>
        <SessionUpdatingFormSubmitter
          mutation={OnboardingStep4Mutation}
          initialState={blankInitialState}
          onSuccessRedirect={Routes.onboarding.step4WelcomeModal}
        >{this.renderForm}</SessionUpdatingFormSubmitter>
        <Route path={Routes.onboarding.step4WelcomeModal} component={Step4WelcomeModal} />
      </Page>
    );
  }
}
