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
import { Modal, ModalLink } from '../modal';

const blankInitialState: OnboardingStep4Input = {
  phoneNumber: '',
  canWeSms: true,
  password: '',
  confirmPassword: '',
  agreeToTerms: false
};

export function TermsModal(): JSX.Element {
  const title = "JustFix Terms and Conditions";

  return (
    <Modal title={title} onCloseGoBack render={(ctx) => (
      <div className="content box">
        <h1 className="title">{title}</h1>
        <p>Ah, the ol' unspecified terms and conditions.</p>
        <button onClick={ctx.close} className="button is-primary is-fullwidth">Got it!</button>
      </div>
    )}/>
  );
}

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
          <span>
            {/*
              * The <span> this is contained in is required to break flexbox layout of
              * these items, which is quite annoying.
              */}
            I agree to the {" "}
            <ModalLink to={Routes.onboarding.step4TermsModal} component={TermsModal}>
              JustFix terms and conditions
            </ModalLink>, which are currently unspecified.
          </span>
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
        <h1 className="title">Contact information</h1>
        <SessionUpdatingFormSubmitter
          mutation={OnboardingStep4Mutation}
          initialState={blankInitialState}
          onSuccessRedirect={Routes.loc.home}
        >{this.renderForm}</SessionUpdatingFormSubmitter>
      </Page>
    );
  }
}
