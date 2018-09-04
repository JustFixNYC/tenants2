import React from 'react';
import { OnboardingStep4Input } from "../queries/globalTypes";
import { GraphQLFetch } from "../graphql-client";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import Page from '../page';
import { FormSubmitter, FormContext } from '../forms';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep4Mutation } from '../queries/OnboardingStep4Mutation';
import { assertNotNull } from '../util';
import { Link } from 'react-router-dom';
import Routes from '../routes';
import { NextButton } from './onboarding-step-1';
import { CheckboxFormField, TextualFormField } from '../form-fields';

const blankInitialState: OnboardingStep4Input = {
  phoneNumber: '',
  canWeSms: false,
  password: '',
  confirmPassword: ''
};

export interface OnboardingStep4Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  initialState?: OnboardingStep4Input|null;
}

export default class OnboardingStep4 extends React.Component<OnboardingStep4Props> {
  @autobind
  handleSubmit(input: OnboardingStep4Input) {
    return fetchOnboardingStep4Mutation(this.props.fetch, { input })
      .then(result => result.onboardingStep4);
  }

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
        <NextButton isLoading={isLoading} />
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
          onSubmit={this.handleSubmit}
          initialState={this.props.initialState || blankInitialState}
          onSuccessRedirect={Routes.home}
          onSuccess={(output) => this.props.onSuccess(assertNotNull(output.session))}
        >{this.renderForm}</FormSubmitter>
      </Page>
    );
  }
}
