import React from 'react';
import { OnboardingStep3Input } from "../queries/globalTypes";
import Page from '../page';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import autobind from 'autobind-decorator';
import { Link, Route } from 'react-router-dom';
import Routes from '../routes';
import { NextButton, BackButton } from "../buttons";
import { IconLink } from "../icon-link";
import { CheckboxFormField, RadiosFormField } from '../form-fields';
import { filterDjangoChoices } from '../common-data';
import { OnboardingStep3Mutation } from '../queries/OnboardingStep3Mutation';
import { Modal, BackOrUpOneDirLevel } from '../modal';
import { OutboundLink } from '../google-analytics';
import { twoTuple } from '../util';
import { glueToLastWord } from '../word-glue';

export const LEASE_CHOICES = filterDjangoChoices(
  require('../../../common-data/lease-choices.json'), ['NOT_SURE']);

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

export function LeaseLearnMoreModal(props: { children: any, title: string }): JSX.Element {
  return (
    <Modal title={props.title} onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => (
      <div className="content box">
        <h1 className="title">{props.title}</h1>
        {props.children}
        <Link {...ctx.getLinkCloseProps()} className="button is-primary is-fullwidth">Got it!</Link>
      </div>
    )}/>
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
      </LeaseInfoModal>
    )
  },
  {
    route: Routes.onboarding.step3NychaModal,
    leaseType: 'NYCHA',
    component: () => (
      <LeaseInfoModal title="NYCHA">
        <p>We’ll make sure your letter gets to the head of the Housing Authority. You should also download the <OutboundLink href="https://www1.nyc.gov/site/nycha/residents/mynycha.page" target="_blank">MyNYCHA app</OutboundLink> to make service requests.</p>
      </LeaseInfoModal>
    )
  },
  {
    route: Routes.onboarding.step3OtherModal,
    leaseType: 'OTHER',
    component: () => (
      <LeaseInfoModal title="Other">
        <p>This is a formal way to request repairs from your landlord and is a good tactic before calling 311.</p>
      </LeaseInfoModal>
    )
  }
];

export const LEASE_LEARN_MORE_MODALS: LeaseModalInfo[] = [
  {
    route: Routes.onboarding.step3LearnMoreModals.rentStabilized,
    leaseType: 'RENT_STABILIZED',
    component: () => (
      <LeaseLearnMoreModal title="About rent stabilization">
        <p>If your building has more than 6 units and was built before 1971, your apartment is likely rent stabilized.</p>
        <p>Check your lease to make sure.</p>
      </LeaseLearnMoreModal>
    )
  },
  {
    route: Routes.onboarding.step3LearnMoreModals.marketRate,
    leaseType: 'MARKET_RATE',
    component: () => (
      <LeaseLearnMoreModal title="Is your lease Market Rate?">
        <p>If you live in a newer building and your rent is over $2700 a month, you probably have a market rate lease.</p>
      </LeaseLearnMoreModal>
    )
  },
  {
    route: Routes.onboarding.step3LearnMoreModals.noLease,
    leaseType: 'NO_LEASE',
    component: () => (
      <LeaseLearnMoreModal title="Alas.">
        <p>It's important that you have a lease. If you are a month to month tenant, you don't have as many rights.</p>
      </LeaseLearnMoreModal>
    )
  }
];

export const ALL_LEASE_MODALS = [...LEASE_MODALS, ...LEASE_LEARN_MORE_MODALS];

const LEASE_LEARN_MORE_MODAL_MAP = new Map(
  LEASE_LEARN_MORE_MODALS.map(info => twoTuple(info.leaseType, info)));

const leaseChoicesWithInfo = LEASE_CHOICES.map(([value, label]) => {
  const info = LEASE_LEARN_MORE_MODAL_MAP.get(value);
  const title = `Learn more about ${label} leases`;

  return twoTuple(value, info ? (
    glueToLastWord(label, <IconLink type="info" title={title} to={info.route} />)
  ) : label);
});

export default class OnboardingStep3 extends React.Component {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep3Input>): JSX.Element {
    return (
      <React.Fragment>
        <RadiosFormField {...ctx.fieldPropsFor('leaseType')} choices={leaseChoicesWithInfo} label="Lease type" />
        <CheckboxFormField {...ctx.fieldPropsFor('receivesPublicAssistance')}>
          I also receive a housing voucher (Section 8, FEPS, Link, HASA, other)
        </CheckboxFormField>
        <div className="buttons jf-two-buttons">
          <BackButton to={Routes.onboarding.step2} label="Back" />
          <NextButton isLoading={ctx.isLoading} />
        </div>
      </React.Fragment>
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
        <p>Your rights vary depending on what type of lease you have.</p>
        <br/>
        <SessionUpdatingFormSubmitter
          mutation={OnboardingStep3Mutation}
          initialState={(session) => session.onboardingStep3 || blankInitialState}
          onSuccessRedirect={(_, input) => OnboardingStep3.getSuccessRedirect(input.leaseType)}
        >{this.renderForm}</SessionUpdatingFormSubmitter>
        {ALL_LEASE_MODALS.map(info => (
          <Route key={info.route} path={info.route} component={info.component} />
        ))}
      </Page>
    );
  }
}
