import React from 'react';
import { OnboardingStep3Input } from "../queries/globalTypes";
import { GraphQLFetch } from "../graphql-client";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import Page from '../page';
import { FormSubmitter, FormContext } from '../forms';
import autobind from 'autobind-decorator';
import { assertNotNull } from '../util';
import { Link, Route } from 'react-router-dom';
import Routes from '../routes';
import { NextButton } from './onboarding-step-1';
import { CheckboxFormField, RadiosFormField } from '../form-fields';
import { DjangoChoices } from '../common-data';
import { fetchOnboardingStep3Mutation } from '../queries/OnboardingStep3Mutation';
import { Modal } from '../modal';

export const LEASE_CHOICES = require('../../../common-data/lease-choices.json') as DjangoChoices;
const NEXT_STEP = Routes.onboarding.step4;

/** These are just the values we refer to in code, not necessarily all possible values. */
export const LeaseChoiceValues = {
  RENT_STABILIZED: 'RENT_STABILIZED'
};

const blankInitialState: OnboardingStep3Input = {
  leaseType: '',
  receivesPublicAssistance: false
};

export function RentStabilizedModal(): JSX.Element {
  return (
    <Modal title="Great news!" onCloseGoTo={NEXT_STEP}>
      <div className="content box">
        <h1 className="title">Great news!</h1>
        <p>As a rent stabilized tenant, you have additional rights that protect you from landlord retaliation, especially your right to a renewal lease every one or two years.</p>
        <Link to={NEXT_STEP} className="button is-primary is-fullwidth">Got it!</Link>
      </div>
    </Modal>
  );
}

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

  getSuccessRedirect(leaseType: string): string {
    switch (leaseType) {
      case LeaseChoiceValues.RENT_STABILIZED:
      return Routes.onboarding.step3RentStabilizedModal;
    }

    return NEXT_STEP;
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
          onSuccessRedirect={(output, input) => {
            this.props.onSuccess(assertNotNull(output.session));
            return this.getSuccessRedirect(input.leaseType);
          }}
        >{this.renderForm}</FormSubmitter>
        <Route path={Routes.onboarding.step3RentStabilizedModal} component={RentStabilizedModal} />
      </Page>
    );
  }
}
