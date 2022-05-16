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
      withHeading="small"
    >
      <LetterCard
        title={li18n._(t`Notice to Repair`)}
        time_mins={15}
        text={li18n._(
          t`Document repairs needed in your home, and send a formal request to your landlord`
        )}
        buttonProps={{
          to: LaLetterBuilderRouteInfo.locale.habitability.latestStep,
          className: "button is-primary is-medium",
          text: li18n._(t`Start a letter`),
        }}
        information={repairsInformationNeeded}
      />
      <LetterCard
        title={li18n._(t`Right to Privacy`)}
        time_mins={15}
        text={li18n._(t`Your landlord can't enter your unit whenever they want. Create a formal request 
        which asks your landlord to follow proper protocol and respect your right to privacy.`)}
        buttonProps={{
          to:
            "https://justfix.formstack.com/forms/saje_right_to_privacy_letter_builder_form",
          className: "button is-light is-medium",
          text: li18n._(t`Go to letter`),
        }}
        information={violationInformationNeeded}
      />
      <LetterCard
        title={li18n._(t`Harassment`)}
        time_mins={10}
        text={li18n._(
          t`Document the harassment you and your family are experiencing and send a notice to your landlord.`
        )}
        buttonProps={{
          to:
            "https://justfix.formstack.com/forms/saje_anti_harassment_letter_builder_form",
          className: "button is-light is-medium",
          text: li18n._(t`Go to letter`),
        }}
        information={violationInformationNeeded}
      />
      <LetterCard
        title={li18n._(t`Private Right of Action`)}
        time_mins={10}
        text={li18n._(
          t`The City of LA allows residential tenants to sue for violations of COVID-19 renter protections. Take the first step by documenting violations and notifying your landlord.`
        )}
        buttonProps={{
          to:
            "https://justfix.formstack.com/forms/saje_la_city_private_right_of_action_letter_builder_form",
          className: "button is-light is-medium",
          text: li18n._(t`Go to letter`),
        }}
        information={violationInformationNeeded}
      />
      <div className="buttons jf-two-buttons">
        <SimpleClearAnonymousSessionButton
          label="Back"
          to={LaLetterBuilderRouteInfo.locale.home}
        />
      </div>
    </Page>
  );
};

const repairsInformationNeeded = [
  li18n._(t`Your contact details`),
  li18n._(t`Your landlord's contact details`),
  li18n._(t`An idea of all the repairs needed in your home`),
  li18n._(t`Dates and time you'll be available for repairs`),
];

const violationInformationNeeded = [
  li18n._(t`Your contact details`),
  li18n._(t`Your landlord's contact details`),
  li18n._(t`Dates that the violation occurred`),
  li18n._(t`Details about the violation`),
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
          {props.text}
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
    <Accordion question={"What information will I need?"} questionClassName="">
      <ul>{listItems}</ul>
      <br />
    </Accordion>
  );
}
