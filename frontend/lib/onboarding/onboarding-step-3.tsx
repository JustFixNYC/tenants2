import React from "react";
import { OnboardingStep3Input } from "../queries/globalTypes";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import autobind from "autobind-decorator";
import { Link, Route } from "react-router-dom";
import { ProgressButtons } from "../ui/buttons";
import { IconLink } from "../ui/icon";
import { RadiosFormField } from "../forms/form-fields";
import { YesNoRadiosFormField } from "../forms/yes-no-radios-form-field";
import { ReactDjangoChoices } from "../common-data";
import {
  OnboardingStep3Mutation,
  BlankOnboardingStep3Input,
} from "../queries/OnboardingStep3Mutation";
import { Modal, BackOrUpOneDirLevel } from "../ui/modal";
import { twoTuple } from "../util/util";
import { glueToLastWord } from "../ui/word-glue";
import { OnboardingRouteInfo } from "./route-info";
import {
  getLeaseChoiceLabels,
  LeaseChoices,
  LeaseChoice,
} from "../../../common-data/lease-choices";
import { FormContext } from "../forms/form-context";

type LeaseInfoModalProps = {
  children: any;
  title: string;
  isWarning?: boolean;
  toNextStep: string;
};

export function LeaseInfoModal(props: LeaseInfoModalProps): JSX.Element {
  return (
    <Modal title={props.title} withHeading onCloseGoTo={props.toNextStep}>
      {props.children}
      <div className="has-text-centered">
        <Link
          to={props.toNextStep}
          className={`button is-primary is-medium ${
            props.isWarning ? "is-danger" : ""
          }`}
        >
          {props.isWarning ? "I understand the risk" : "Continue"}
        </Link>
      </div>
    </Modal>
  );
}

export function LeaseLearnMoreModal(props: {
  children: any;
  title: string;
}): JSX.Element {
  return (
    <Modal
      title={props.title}
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          {props.children}
          <div className="has-text-centered">
            <Link
              {...ctx.getLinkCloseProps()}
              className="button is-primary is-medium"
            >
              Got it!
            </Link>
          </div>
        </>
      )}
    />
  );
}

type LeaseModalInfo = {
  route: string;
  leaseType: LeaseChoice;
  component: () => JSX.Element;
};

const GENERIC_NO_LEASE_WARNING = (
  <p>
    <strong className="has-text-danger">Warning:</strong> If you do not have a
    lease, taking action against your landlord could provoke retaliation and/or
    an eviction notice once the Eviction Moratorium is lifted.{" "}
    <strong>
      Take caution and make sure that this service is right for you.
    </strong>
  </p>
);

export const createLeaseModals = (
  routes: OnboardingRouteInfo
): LeaseModalInfo[] => [
  {
    route: routes.step3RentStabilizedModal,
    leaseType: "RENT_STABILIZED",
    component: () => (
      <LeaseInfoModal title="Great news!" toNextStep={routes.step4}>
        <p>
          As a rent stabilized tenant, you have additional rights that protect
          you from landlord retaliation, especially your right to a renewal
          lease every one or two years.
        </p>
      </LeaseInfoModal>
    ),
  },
  {
    route: routes.step3MarketRateModal,
    leaseType: "MARKET_RATE",
    component: () => (
      <LeaseInfoModal
        title="Market Rate lease"
        isWarning
        toNextStep={routes.step4}
      >
        <p>
          <strong className="has-text-danger">Warning:</strong> Taking action
          against your landlord could provoke retaliation and/or an eviction
          notice once the Eviction Moratorium is lifted.{" "}
          <strong>
            Take caution and make sure that this service is right for you.
          </strong>
        </p>
      </LeaseInfoModal>
    ),
  },
  {
    route: routes.step3OtherModal,
    leaseType: "OTHER",
    component: () => (
      <LeaseInfoModal
        title="Other (Mitchell Lama, COOP/Condo, House, HUD, etc.)"
        isWarning
        toNextStep={routes.step4}
      >
        {GENERIC_NO_LEASE_WARNING}
      </LeaseInfoModal>
    ),
  },
  {
    route: routes.step3NoLeaseModal,
    leaseType: "NO_LEASE",
    component: () => (
      <LeaseInfoModal title="No lease" isWarning toNextStep={routes.step4}>
        {GENERIC_NO_LEASE_WARNING}
      </LeaseInfoModal>
    ),
  },
  {
    route: routes.step3NoLeaseModal,
    leaseType: "NOT_SURE", // might want to rewrite the Generic no lease warning for this.
    component: () => (
      <LeaseInfoModal title="Not sure" isWarning toNextStep={routes.step4}>
        {GENERIC_NO_LEASE_WARNING}
      </LeaseInfoModal>
    ),
  },
];

export const createLeaseLearnMoreModals = (
  routes: OnboardingRouteInfo
): LeaseModalInfo[] => [
  {
    route: routes.step3LearnMoreModals.rentStabilized,
    leaseType: "RENT_STABILIZED",
    component: () => (
      <LeaseLearnMoreModal title="About rent stabilization">
        <p>
          If your building has more than 6 units and was built before 1974, your
          apartment is likely rent stabilized.
        </p>
        <p>Check your lease to make sure.</p>
      </LeaseLearnMoreModal>
    ),
  },
  {
    route: routes.step3LearnMoreModals.marketRate,
    leaseType: "MARKET_RATE",
    component: () => (
      <LeaseLearnMoreModal title="Is your lease Market Rate?">
        <p>
          If you live in a newer building and your rent is over $2700 a month,
          you probably have a market rate lease.
        </p>
      </LeaseLearnMoreModal>
    ),
  },
  {
    route: routes.step3LearnMoreModals.noLease,
    leaseType: "NO_LEASE",
    component: () => (
      <LeaseLearnMoreModal title="Month-to-month tenants">
        <p>
          It's important that you have a lease. If you are a month-to-month
          tenant, you don't have as many rights.
        </p>
      </LeaseLearnMoreModal>
    ),
  },
];

type OnboardingStep3Props = {
  routes: OnboardingRouteInfo;
};

export default class OnboardingStep3 extends React.Component<
  OnboardingStep3Props
> {
  readonly leaseModals: LeaseModalInfo[];
  readonly leaseLearnMoreModals: LeaseModalInfo[];
  readonly allLeaseModals: LeaseModalInfo[];
  readonly leaseChoicesWithInfo: ReactDjangoChoices;

  constructor(props: OnboardingStep3Props) {
    super(props);
    this.leaseModals = createLeaseModals(this.props.routes);
    this.leaseLearnMoreModals = createLeaseLearnMoreModals(this.props.routes);
    this.allLeaseModals = [...this.leaseModals, ...this.leaseLearnMoreModals];

    const leaseLearnMoreModalMap = new Map(
      this.leaseLearnMoreModals.map((info) => twoTuple(info.leaseType, info))
    );

    const leaseLabels = getLeaseChoiceLabels();

    this.leaseChoicesWithInfo = LeaseChoices.map((value) => {
      const label = leaseLabels[value];
      const info = leaseLearnMoreModalMap.get(value);
      const title = `Learn more about ${label} leases`;

      return twoTuple(
        value,
        info
          ? glueToLastWord(
              label,
              <IconLink type="info" title={title} to={info.route} />
            )
          : label
      );
    });
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep3Input>): JSX.Element {
    return (
      <React.Fragment>
        <RadiosFormField
          {...ctx.fieldPropsFor("leaseType")}
          choices={this.leaseChoicesWithInfo}
          label="Housing type"
        />
        <YesNoRadiosFormField
          {...ctx.fieldPropsFor("receivesPublicAssistance")}
          label="Do you receive a housing voucher (Section 8, FEPS, Link, HASA, other)?"
        />
        <ProgressButtons
          back={this.props.routes.step1}
          isLoading={ctx.isLoading}
        />
      </React.Fragment>
    );
  }

  getSuccessRedirect(leaseType: string): string {
    for (let info of this.leaseModals) {
      if (info.leaseType === leaseType) {
        return info.route;
      }
    }

    return this.props.routes.step4;
  }

  // Should everything in here be internationalized?
  render() {
    return (
      <Page title="What type of housing do you live in?">
        <div>
          <h1 className="title is-4 is-spaced">
            What type of housing do you live in?
          </h1>
          <p className="subtitle is-6">
            Your rights vary depending on what type of housing you live in.
          </p>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep3Mutation}
            initialState={(session) =>
              session.onboardingStep3 || BlankOnboardingStep3Input
            }
            onSuccessRedirect={(_, input) =>
              this.getSuccessRedirect(input.leaseType)
            }
          >
            {this.renderForm}
          </SessionUpdatingFormSubmitter>
        </div>

        {this.allLeaseModals.map((info) => (
          <Route
            key={info.route}
            path={info.route}
            component={info.component}
          />
        ))}
      </Page>
    );
  }
}
