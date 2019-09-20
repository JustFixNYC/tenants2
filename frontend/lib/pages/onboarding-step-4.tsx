import React from 'react';
import { OnboardingStep4Input, OnboardingInfoSignupIntent } from "../queries/globalTypes";
import Page from '../page';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import autobind from 'autobind-decorator';
import { OnboardingStep4Mutation, BlankOnboardingStep4Input } from '../queries/OnboardingStep4Mutation';
import { OnboardingRouteInfo } from '../routes';
import { ProgressButtons } from "../buttons";
import { CheckboxFormField, TextualFormField, HiddenFormField } from '../form-fields';
import { PhoneNumberFormField } from '../phone-number-form-field';
import { ModalLink } from '../modal';
import { PrivacyInfoModal } from './onboarding-step-1';
import { fbq } from '../facebook-pixel';
import { FormContext } from '../form-context';
import { getDataLayer } from '../google-tag-manager';

type OnboardingStep4Props = {
  routes: OnboardingRouteInfo;
  toSuccess: string;
  signupIntent: OnboardingInfoSignupIntent;
};

export default class OnboardingStep4 extends React.Component<OnboardingStep4Props> {
  private readonly blankInitialState: OnboardingStep4Input = {
    ...BlankOnboardingStep4Input,
    canWeSms: true,
    signupIntent: this.props.signupIntent,
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
        <ProgressButtons back={routes.step3} isLoading={ctx.isLoading} nextLabel="Create my account" />
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
            onSuccess={(output) => {
              fbq('trackCustom','NewUserSignup');
              getDataLayer().push({
                event: 'jf.signup',
                'jf.signupIntent': output.session && output.session.onboardingInfo && output.session.onboardingInfo.signupIntent
              });
            }}
          >{this.renderForm}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
