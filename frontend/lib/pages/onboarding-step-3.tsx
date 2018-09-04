import React from 'react';
import { OnboardingStep3Input } from "../queries/globalTypes";
import { GraphQLFetch } from "../graphql-client";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import Page from '../page';
import { FormSubmitter, FormContext } from '../forms';
import autobind from 'autobind-decorator';
import { assertNotNull } from '../util';
import { Link } from 'react-router-dom';
import Routes from '../routes';
import { NextButton } from './onboarding-step-1';
import { CheckboxFormField, RadiosFormField } from '../form-fields';
import { DjangoChoices } from '../common-data';
import { fetchOnboardingStep3Mutation } from '../queries/OnboardingStep3Mutation';

const LEASE_CHOICES = require('../../../common-data/lease-choices.json') as DjangoChoices;


const blankInitialState: OnboardingStep3Input = {
  leaseType: '',
  receivesPublicAssistance: false
};

export interface OnboardingStep3Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  initialState?: OnboardingStep3Input|null;
}

export default class OnboardingStep3 extends React.Component<OnboardingStep3Props> {
  @autobind
  handleSubmit(input: OnboardingStep3Input) {
    return fetchOnboardingStep3Mutation(this.props.fetch, { input })
      .then(result => result.onboardingStep3);
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep3Input>): JSX.Element {
    return (
      <React.Fragment>
        <RadiosFormField {...ctx.fieldPropsFor('leaseType')} choices={LEASE_CHOICES} label="Lease type" />
        <CheckboxFormField {...ctx.fieldPropsFor('receivesPublicAssistance')}>
          I receive public assistance (Section 8, FEHPS, Link, HASA, other)
        </CheckboxFormField>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.onboarding.step2} className="button is-text">Back</Link>
        </div>
        <NextButton isLoading={isLoading} />
      </div>
    );
  }

  render() {
    return (
      <Page title="What type of lease do you have?">
        <h1 className="title">What type of lease do you have?</h1>
        <p>Your rights vary depending on what type of lease you have. <strong>If you're not sure, we'll help you.</strong></p>
        <br/>
        <FormSubmitter
          onSubmit={this.handleSubmit}
          initialState={this.props.initialState || blankInitialState}
          onSuccessRedirect={Routes.onboarding.step4}
          onSuccess={(output) => this.props.onSuccess(assertNotNull(output.session))}
        >{this.renderForm}</FormSubmitter>
      </Page>
    );
  }
}
