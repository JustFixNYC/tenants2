import React from 'react';
import { OnboardingStep4Input } from "../queries/globalTypes";
import Page from '../page';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import autobind from 'autobind-decorator';
import { OnboardingStep4Mutation } from '../queries/OnboardingStep4Mutation';
import Routes from '../routes';
import { NextButton, BackButton } from "../buttons";
import { CheckboxFormField, TextualFormField } from '../form-fields';
import { PhoneNumberFormField } from '../phone-number-form-field';
import { ModalLink } from '../modal';
import { PrivacyInfoModal } from './onboarding-step-1';
import { fbq } from '../faceboox-pixel';

const blankInitialState: OnboardingStep4Input = {
  phoneNumber: '',
  canWeSms: true,
  password: '',
  confirmPassword: '',
  agreeToTerms: false
};

export default class OnboardingStep4 extends React.Component {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Input>): JSX.Element {
    return (
      <React.Fragment>
        <PhoneNumberFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
        <CheckboxFormField {...ctx.fieldPropsFor('canWeSms')}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <p>
          You can optionally create a password-protected account now, which will allow you to securely log in and check your progress.
        </p>
        <br/>
        <TextualFormField label="Create a password (optional)" type="password" {...ctx.fieldPropsFor('password')} />
        <TextualFormField label="Please confirm your password (optional)" type="password" {...ctx.fieldPropsFor('confirmPassword')} />
        <CheckboxFormField {...ctx.fieldPropsFor('agreeToTerms')}>
          I agree to the {" "}
          <ModalLink to={Routes.onboarding.step4TermsModal} component={PrivacyInfoModal}>
            JustFix.nyc terms and conditions
          </ModalLink>.
        </CheckboxFormField>
        <div className="buttons jf-two-buttons">
          <BackButton to={Routes.onboarding.step3} label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Finish" />
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="Contact information">
        <div className="box">
          <h1 className="title">Contact information</h1>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep4Mutation}
            initialState={blankInitialState}
            onSuccessRedirect={Routes.loc.home}
            onSuccess={() => fbq('track','CompleteRegistration')}
          >{this.renderForm}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
