import React from 'react';
import { OnboardingStep4Input } from "../queries/globalTypes";
import { GraphQLFetch } from "../graphql-client";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import Page from '../page';
import { FormSubmitter, FormContext } from '../forms';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep4Mutation } from '../queries/OnboardingStep4Mutation';
import { assertNotNull } from '../util';
import { Link, Route } from 'react-router-dom';
import Routes from '../routes';
import { NextButton } from "../buttons";
import { CheckboxFormField, TextualFormField } from '../form-fields';
import { Modal } from '../modal';
import { WelcomeFragment } from '../letter-of-complaint-common';
import { createMutationSubmitHandler } from '../forms-graphql';

const blankInitialState: OnboardingStep4Input = {
  phoneNumber: '',
  canWeSms: true,
  password: '',
  confirmPassword: ''
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

export interface OnboardingStep4Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  initialState?: OnboardingStep4Input|null;
}

export default class OnboardingStep4 extends React.Component<OnboardingStep4Props> {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
        <CheckboxFormField {...ctx.fieldPropsFor('canWeSms')}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <TextualFormField label="Create a password" type="password" {...ctx.fieldPropsFor('password')} />
        <TextualFormField label="Please confirm your password" type="password" {...ctx.fieldPropsFor('confirmPassword')} />
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.onboarding.step3} className="button is-text">Back</Link>
        </div>
        <NextButton isLoading={isLoading} label="Create account" />
      </div>
    );
  }

  render() {
    return (
      <Page title="Last step! Let's create your account.">
        <h1 className="title">Last step! Let's create your account.</h1>
        <p>Now we'll create an account to save your progress.</p>
        <br/>
        <FormSubmitter
          onSubmit={createMutationSubmitHandler(this.props.fetch, fetchOnboardingStep4Mutation)}
          initialState={this.props.initialState || blankInitialState}
          onSuccessRedirect={Routes.onboarding.step4WelcomeModal}
          onSuccess={(output) => this.props.onSuccess(assertNotNull(output.session))}
        >{this.renderForm}</FormSubmitter>
        <Route path={Routes.onboarding.step4WelcomeModal} component={Step4WelcomeModal} />
      </Page>
    );
  }
}
