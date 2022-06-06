import React from "react";
import { OnboardingStep3Input } from "../queries/globalTypes";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import autobind from "autobind-decorator";
import { Link, Route } from "react-router-dom";
import { ProgressButtons } from "../ui/buttons";
import { IconLink } from "../ui/icon";
import { RadiosFormField } from "../forms/form-fields";
import {
  optionalBooleanToYesNoChoice,
  YesNoRadiosFormField,
} from "../forms/yes-no-radios-form-field";
import { ReactDjangoChoices } from "../common-data";
import {
  OnboardingStep3Mutation,
  BlankOnboardingStep3Input,
} from "../queries/OnboardingStep3Mutation";
import { Modal, BackOrUpOneDirLevel } from "../ui/modal";
import { exactSubsetOrDefault, twoTuple } from "../util/util";
import { glueToLastWord } from "../ui/word-glue";
import { OnboardingRouteInfo } from "./route-info";
import {
  getLeaseChoiceLabels,
  LeaseChoices,
  LeaseChoice,
} from "../../../common-data/lease-choices";
import { FormContext } from "../forms/form-context";
import {
  HOUSING_TYPE_FIELD_LABEL,
  PUBLIC_ASSISTANCE_QUESTION_TEXT,
} from "../util/housing-type";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { OutboundLink } from "../ui/outbound-link";

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
          className={`button is-primary is-medium ${props.isWarning ? "is-danger" : ""
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

export const createLeaseModals = (
  routes: OnboardingRouteInfo
): LeaseModalInfo[] => [
    {
      route: routes.step3RentStabilizedModal,
      leaseType: "RENT_STABILIZED",
      component: () => (
        <LeaseInfoModal title="Rent stabilized" toNextStep={routes.step4}>
          <p>
            Good news! As a rent regulated tenant, you likely have extra
            protections against retaliation. Want to find out if you’re being
            overcharged? Order your rent history{" "}
            <OutboundLink href="https://app.justfix.org/en/rh/splash">
              here
            </OutboundLink>
            !
          </p>
        </LeaseInfoModal>
      ),
    },
    {
      route: routes.step3MarketRateModal,
      leaseType: "MARKET_RATE",
      component: () => (
        <LeaseInfoModal title="Market Rate" isWarning toNextStep={routes.step4}>
          <p>
            <strong className="has-text-danger">Know the Risks:</strong> Market
            tenants have fewer protections against eviction and larger rent
            increases than rent regulated tenants.{" "}
          </p>
          <p>
            Retaliation is <b>illegal</b> and all New Yorkers are{" "}
            <b>entitled to repairs</b> but, if you use this tool, your landlord
            could retaliate by raising the rent or sending a termination notice
            once your lease ends.
          </p>
          <p>
            <strong className="has-text-danger">Proceed with caution.</strong>
          </p>
        </LeaseInfoModal>
      ),
    },
    {
      route: routes.step3NotSureModal,
      leaseType: "NOT_SURE",
      component: () => (
        <LeaseInfoModal title="Not sure" isWarning toNextStep={routes.step4}>
          <p>
            <strong className="has-text-danger">Know the Risks:</strong> If you
            aren’t sure about your regulated status, you may want to do more
            research before using our tools. Non-regulated tenants have fewer
            protections against eviction and larger rent increases than regulated
            tenants.{" "}
            <OutboundLink href="https://rentguidelinesboard.cityofnewyork.us/resources/faqs/">
              Learn more here
            </OutboundLink>
            .
          </p>
          <p>
            Retaliation is <b>illegal</b> and all New Yorkers are{" "}
            <b>entitled to repairs</b> but, if you use this tool, your landlord
            could retaliate by raising the rent or sending a termination notice
            once your lease ends.
          </p>
          <p>
            <strong className="has-text-danger">Proceed with caution.</strong>
          </p>
        </LeaseInfoModal>
      ),
    },
  ];

function toStep3Input(s: AllSessionInfo): OnboardingStep3Input {
  const scf = s.onboardingScaffolding;
  if (!scf) return BlankOnboardingStep3Input;
  return exactSubsetOrDefault(
    {
      ...scf,
      receivesPublicAssistance: optionalBooleanToYesNoChoice(
        scf.receivesPublicAssistance
      ),
    },
    BlankOnboardingStep3Input
  );
}

export const createLeaseLearnMoreModals = (
  routes: OnboardingRouteInfo
): LeaseModalInfo[] => [
    {
      route: routes.step3LearnMoreModals.rentStabilized,
      leaseType: "RENT_STABILIZED",
      component: () => (
        <LeaseLearnMoreModal title="What is Rent Stabilized Housing?">
          <p>
            Housing in buildings built before January 1, 1974 with six or more
            units, including Single Room Occupancy (“SRO”) hotels and rooming
            houses.
          </p>
          <p>
            All apartments in buildings that receive a tax abatement such as J-51,
            421a, and 421g are also stabilized.
          </p>
        </LeaseLearnMoreModal>
      ),
    },
    {
      route: routes.step3LearnMoreModals.rentControlled,
      leaseType: "RENT_CONTROLLED",
      component: () => (
        <LeaseLearnMoreModal title="What is Rent Controlled Housing?">
          <p>
            This is a rare kind of housing! Buildings that had three or more
            residential units before February 1, 1947, where the tenant or
            immediate family member has been continuously living in the apartment
            since July 1, 1971.
          </p>
        </LeaseLearnMoreModal>
      ),
    },
    {
      route: routes.step3LearnMoreModals.marketRate,
      leaseType: "MARKET_RATE",
      component: () => (
        <LeaseLearnMoreModal title="What is Market Rate Housing?">
          <p>
            Market rate tenants typically live in buildings of fewer than six (6)
            units, newer buildings, or formerly rent stabilized apartments that a
            landlord deregulated before 2019.
          </p>
        </LeaseLearnMoreModal>
      ),
    },
    {
      route: routes.step3LearnMoreModals.NYCHA,
      leaseType: "NYCHA",
      component: () => (
        <LeaseLearnMoreModal title="What is NYCHA or Public Housing?">
          <p>
            Federally-funded affordable housing developments owned by the
            government.
          </p>
        </LeaseLearnMoreModal>
      ),
    },
    {
      route: routes.step3LearnMoreModals.otherAffordable,
      leaseType: "OTHER_AFFORDABLE",
      component: () => (
        <LeaseLearnMoreModal title="What is Affordable Housing (other than rent stabilized)?">
          <p>
            New York City has many forms of affordable housing. Some common types
            include Mitchell Lama, Project-Based Section 8 buildings (also known
            as HUD), LIHTC, HDFC rentals, and others.
          </p>
        </LeaseLearnMoreModal>
      ),
    },
    {
      route: routes.step3LearnMoreModals.notSure,
      leaseType: "NOT_SURE",
      component: () => (
        <LeaseLearnMoreModal title="Don’t know what type of housing you live in?">
          <p>
            New York City has many kinds of housing. Learn more by ordering your
            rent history{" "}
            <OutboundLink href="https://app.justfix.org/en/rh/splash">
              here
            </OutboundLink>{" "}
            or reading about{" "}
            <OutboundLink href="https://rentguidelinesboard.cityofnewyork.us/resources/faqs/rent-stabilization/">
              rent regulation
            </OutboundLink>
            .
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

    this.leaseChoicesWithInfo = LeaseChoices.filter(
      // NO_LEASE and RENT_STABILIZED_OR_CONTROLLED have been deprecated;
      // we want legacy users to keep their data, but we don't want new users to be
      // able to choose this option.
      (c) => c !== "NO_LEASE" && c !== "RENT_STABILIZED_OR_CONTROLLED"
    ).map((value) => {
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
          label={HOUSING_TYPE_FIELD_LABEL}
        />
        <YesNoRadiosFormField
          {...ctx.fieldPropsFor("receivesPublicAssistance")}
          label={PUBLIC_ASSISTANCE_QUESTION_TEXT}
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
            initialState={toStep3Input}
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
