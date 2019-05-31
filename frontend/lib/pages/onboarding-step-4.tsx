import React from 'react';
import { OnboardingStep4Input, OnboardingInfoSignupIntent } from "../queries/globalTypes";
import Page from '../page';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import autobind from 'autobind-decorator';
import { OnboardingStep4Mutation } from '../queries/OnboardingStep4Mutation';
import { OnboardingRouteInfo } from '../routes';
import { NextButton } from "../buttons";
import { CheckboxFormField, TextualFormField, HiddenFormField } from '../form-fields';
import { PhoneNumberFormField } from '../phone-number-form-field';
import { ModalLink } from '../modal';
import { PrivacyInfoModal } from './onboarding-step-1';
import { fbq } from '../faceboox-pixel';
import { BackToPrevStepButton } from '../progress-elements';

type OnboardingStep4Props = {
  routes: OnboardingRouteInfo;
  toSuccess: string;
  signupIntent: OnboardingInfoSignupIntent;
};

export default class OnboardingStep4 extends React.Component<OnboardingStep4Props> {
  private readonly blankInitialState: OnboardingStep4Input = {
    phoneNumber: '',
    canWeSms: true,
    signupIntent: this.props.signupIntent,
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Input>): JSX.Element {
    const { routes } = this.props;

    return (
      <React.Fragment>
        <PhoneNumberFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
        <CheckboxFormField {...ctx.fieldPropsFor('canWeSms')}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <HiddenFormField {...ctx.fieldPropsFor('signupIntent')} />
        <br />
        <TextualFormField label="Create a password (optional)" type="password" {...ctx.fieldPropsFor('password')} />
        <TextualFormField label="Please confirm your password (optional)" type="password" {...ctx.fieldPropsFor('confirmPassword')} />
        <CheckboxFormField {...ctx.fieldPropsFor('agreeToTerms')}>
          I agree to the {" "}
          <ModalLink to={routes.step4TermsModal} component={PrivacyInfoModal}>
            JustFix.nyc terms and conditions
          </ModalLink>.
        </CheckboxFormField>
        <div className="buttons jf-two-buttons">
          <BackToPrevStepButton label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Create my account" />
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="Contact information">
        <div>
          <h1 className="title is-4">Your contact information</h1>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep4Mutation}
            initialState={this.blankInitialState}
            onSuccessRedirect={this.props.toSuccess}
            onSuccess={() => fbq('track','CompleteRegistration')}
          >{this.renderForm}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
