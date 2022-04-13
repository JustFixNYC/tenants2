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
        information={li18n._(t`notice to repair information needed`)}
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
        information={li18n._(t`right to privacy information needed`)}
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
        information={li18n._(t`harassment information needed`)}
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
        information={li18n._(t`private right of action information needed`)}
      />
      <div className="buttons jf-two-buttons">
        <SimpleClearAnonymousSessionButton
          to={LaLetterBuilderRouteInfo.locale.home}
        />
      </div>
    </Page>
  );
};

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
  information: string;
};

const LetterCard: React.FC<LetterCardProps> = (props) => {
  return (
    <>
      <div className="jf-la-letter-card">
        <div className="content">
          <h2>{props.title}</h2>
          <div className="jf-la-letter-time">{props.time_mins} mins</div>
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
  information: string;
};

function InformationNeeded({ information }: InformationNeededProps) {
  return (
    <Accordion question={"What information will I need?"} questionClassName="">
      {information}
    </Accordion>
  );
}
