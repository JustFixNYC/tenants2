import React from "react";

import { t } from "@lingui/macro";

import { li18n } from "../../i18n-lingui";
import Page from "../../ui/page";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { Link } from "react-router-dom";
import { SimpleClearAnonymousSessionButton } from "../../forms/clear-anonymous-session-button";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { OutboundLink } from "../../ui/outbound-link";
import classnames from "classnames";
import { Accordion } from "../../ui/accordion";
import { StaticImage } from "../../ui/static-image";
import { getLaLetterBuilderImageSrc } from "../homepage";

export const LaLetterBuilderChooseLetterStep: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page
      title={li18n._(t`Select a letter to get started`)}
      className="content"
    >
      <section className="jf-laletterbuilder-section-primary">
        <h1>{li18n._(t`Select a letter to get started`)}</h1>
        <LetterCard
          title={li18n._(t`Notice to Repair`)}
          time_mins={15}
          text={li18n._(
            t`Write your landlord a letter to formally document your request for repairs.`
          )}
          buttonProps={{
            to: LaLetterBuilderRouteInfo.locale.habitability.latestStep,
            className: "button is-primary is-medium",
            text: li18n._(t`Select letter`),
          }}
          information={repairsInformationNeeded}
        />
      </section>
      <section className="jf-laletterbuilder-section-secondary">
        <p>{li18n._(t`We're working on adding more letters.`)}</p>
        <p className="subtitle">
          {li18n._(
            t`Until then, here are some other forms you can fill, print and mail yourself.`
          )}
        </p>
        <LetterCard
          title={li18n._(t`Right to Privacy`)}
          time_mins={15}
          text={li18n._(
            t`Landlords must give 24-hour written notice to enter your unit. Make a formal request that your landlord respect your right to privacy.`
          )}
          buttonProps={{
            to:
              "https://justfix.formstack.com/forms/saje_right_to_privacy_letter_builder_form",
            className: "button is-light is-medium",
            text: li18n._(t`Go to form`),
          }}
          information={privacyInformationNeeded}
        />
        <LetterCard
          title={li18n._(t`Anti-Harassment`)}
          time_mins={10}
          text={li18n._(
            t`Document the harassment you and your family are experiencing and send a notice to your landlord.`
          )}
          buttonProps={{
            to:
              "https://justfix.formstack.com/forms/saje_anti_harassment_letter_builder_form",
            className: "button is-light is-medium",
            text: li18n._(t`Go to form`),
          }}
          information={harassmentInformationNeeded}
        />
        <LetterCard
          title={li18n._(t`Private Right of Action`)}
          time_mins={10}
          text={li18n._(
            t`The City of LA allows residential tenants to sue for violations of COVID-19 renter protections. Document violations and notify your landlord. `
          )}
          buttonProps={{
            to:
              "https://justfix.formstack.com/forms/saje_la_city_private_right_of_action_letter_builder_form",
            className: "button is-light is-medium",
            text: li18n._(t`Go to form`),
          }}
          information={rightOfActionInformationNeeded}
        />
      </section>
    </Page>
  );
};

const repairsInformationNeeded = [
  li18n._(t`Repairs needed in your home`),
  li18n._(t`Dates and times you’ll be available for repairs`),
  li18n._(t`Landlord or property manager’s contact information`),
];

const privacyInformationNeeded = [
  li18n._(t`Dates when the landlord tried to access your home`),
  li18n._(t`Landlord or property manager’s contact information`),
];

const harassmentInformationNeeded = [
  li18n._(t`Dates the harassment occurred`),
  li18n._(t`Details about the events`),
  li18n._(t`Landlord or property manager’s contact information`),
];

const rightOfActionInformationNeeded = [
  li18n._(t`Dates the COVID-19 renter protections were violated`),
  li18n._(t`Details about the events`),
  li18n._(t`Landlord or property manager’s contact information`),
];

type LetterCardButtonProps = {
  to: string;
  text: string;
  className?: string;
};

type LetterCardProps = {
  title: string;
  time_mins: number;
  text: string;
  badge?: JSX.Element;
  buttonProps: LetterCardButtonProps;
  information: string[];
};

const LetterCard: React.FC<LetterCardProps> = (props) => {
  return (
    <>
      <div className="jf-la-letter-card">
        <div className="content">
          <h2>{props.title}</h2>
          <div className="jf-la-letter-time">
            <div className="jf-clock-icon">
              <StaticImage
                ratio="is-16x16"
                src={getLaLetterBuilderImageSrc("clock")}
                alt={li18n._(t`Estimated time to complete`)}
              />
            </div>
            {props.time_mins} mins
          </div>
          <span>{props.text}</span>
          <CallToAction {...props.buttonProps} />
        </div>
        <hr />
        <InformationNeeded information={props.information} />
      </div>
    </>
  );
};

function CallToAction({ to, text, className }: LetterCardButtonProps) {
  const isInternal = to[0] === "/";
  const content = <>{text}</>;
  if (isInternal) {
    return (
      <Link to={to} className={classnames("jf-card-button", className)}>
        {content}
      </Link>
    );
  }
  return (
    <OutboundLink
      href={to}
      rel="noopener noreferrer"
      target="_blank"
      className={classnames("jf-card-button", className)}
    >
      {content}
    </OutboundLink>
  );
}

type InformationNeededProps = {
  information: string[];
};

function InformationNeeded({ information }: InformationNeededProps) {
  const listItems = information.map((item, i) => <li key={i}>{item}</li>);
  return (
    <Accordion
      question={li18n._(t`What information will I need?`)}
      questionClassName=""
    >
      <ul>{listItems}</ul>
      <br />
    </Accordion>
  );
}
