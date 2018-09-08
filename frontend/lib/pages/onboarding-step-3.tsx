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
import { createMutationSubmitHandler } from '../forms-graphql';

export const LEASE_CHOICES = require('../../../common-data/lease-choices.json') as DjangoChoices;
const NEXT_STEP = Routes.onboarding.step4;

const blankInitialState: OnboardingStep3Input = {
  leaseType: '',
  receivesPublicAssistance: false
};

export function LeaseInfoModal(props: { children: any, title: string }): JSX.Element {
  return (
    <Modal title={props.title} onCloseGoTo={NEXT_STEP}>
      <div className="content box">
        <h1 className="title">{props.title}</h1>
        {props.children}
        <Link to={NEXT_STEP} className="button is-primary is-fullwidth">Got it!</Link>
      </div>
    </Modal>
  );
}

type LeaseModalInfo = {
  route: string;
  leaseType: string;
  component: () => JSX.Element;
};

export const LEASE_MODALS: LeaseModalInfo[] = [
  {
    route: Routes.onboarding.step3RentStabilizedModal,
    leaseType: 'RENT_STABILIZED',
    component: () => (
      <LeaseInfoModal title="Great news!">
        <p>As a rent stabilized tenant, you have additional rights that protect you from landlord retaliation, especially your right to a renewal lease every one or two years.</p>
      </LeaseInfoModal>
    )
  },
  {
    route: Routes.onboarding.step3MarketRateModal,
    leaseType: 'MARKET_RATE',
    component: () => (
      <LeaseInfoModal title="Market rate lease">
        <p>Sending a Letter of Complaint is a formal way to request repairs from your landlord and is a good tactic to try before calling 311.</p>
        <p>As a market rate tenant you should be aware of "landlord retaliation" and that you are not guaranteed the right to a renewal lease.</p>
      </LeaseInfoModal>
    )
  },
  {
    route: Routes.onboarding.step3UncertainLeaseModal,
    leaseType: 'NOT_SURE',
    component: () => (
      <LeaseInfoModal title="Not sure about your lease?">
        <p>If you aren't sure, check your lease.</p>
        <p>You can also request a copy of your rental history via email from the Division of Housing and Community Renewal. This is a private request and you'll get a letter in the mail in about a week; the landlord will never know.</p>
        <p>For more details, visit <a href="https://amirentstabilized.com/">amirentstabilized.com</a>.</p>
      </LeaseInfoModal>
    )
  },
  {
    route: Routes.onboarding.step3NoLeaseModal,
    leaseType: 'NO_LEASE',
    component: () => (
      <LeaseInfoModal title="No lease">
        <p>If you are a month-to-month tenant, you don't have many rights protecting you from "landlord retaliation".</p>
      </LeaseInfoModal>
    )
  }
];

export interface OnboardingStep3Props {
  fetch: GraphQLFetch;
  onSuccess: (session: Partial<AllSessionInfo>) => void;
  initialState?: OnboardingStep3Input|null;
}

export default class OnboardingStep3 extends React.Component<OnboardingStep3Props> {
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

  static getSuccessRedirect(leaseType: string): string {
    for (let info of LEASE_MODALS) {
      if (info.leaseType === leaseType) {
        return info.route;
      }
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
          onSubmit={createMutationSubmitHandler(this.props.fetch, fetchOnboardingStep3Mutation)}
          initialState={this.props.initialState || blankInitialState}
          onSuccessRedirect={(output, input) => {
            this.props.onSuccess(assertNotNull(output.session));
            return OnboardingStep3.getSuccessRedirect(input.leaseType);
          }}
        >{this.renderForm}</FormSubmitter>
        {LEASE_MODALS.map(info => (
          <Route key={info.route} path={info.route} component={info.component} />
        ))}
      </Page>
    );
  }
}
