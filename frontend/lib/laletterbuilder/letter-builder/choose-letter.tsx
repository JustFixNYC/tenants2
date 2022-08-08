import React, { useContext } from "react";

import { t } from "@lingui/macro";

import { li18n } from "../../i18n-lingui";
import Page from "../../ui/page";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { Link } from "react-router-dom";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { OutboundLink } from "../../ui/outbound-link";
import classnames from "classnames";
import { Accordion } from "../../ui/accordion";
import { StaticImage } from "../../ui/static-image";
import { getLaLetterBuilderImageSrc } from "../homepage";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { LaLetterBuilderCreateLetterMutation } from "../../queries/LaLetterBuilderCreateLetterMutation";
import { NextButton } from "../../ui/buttons";
import { AppContext } from "../../app-context";
import ResponsiveElement from "../components/responsive-element";
import { logEvent } from "../../analytics/util";
import { LetterChoice } from "../../../../common-data/la-letter-builder-letter-choices";

export const LaLetterBuilderChooseLetterStep: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title={li18n._(t`Select a letter to get started`)}>
      <section className="jf-laletterbuilder-section-primary">
        <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
          {li18n._(t`Select a letter to get started`)}
        </ResponsiveElement>
        <ResponsiveElement className="mb-7" desktop="h4" touch="h3">
          {li18n._(
            t`Use our tool to create a letter and we can mail it for free.`
          )}
        </ResponsiveElement>
        <CreateLetterCard />
      </section>
      <section className="jf-laletterbuilder-section-secondary">
        <ResponsiveElement className="mb-5" desktop="h2" touch="h3">
          {li18n._(t`We're working on adding more letters.`)}
        </ResponsiveElement>
        <p className="mb-8">
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
            className: "button is-light is-medium mb-3",
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
            className: "button is-light is-medium mb-3",
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
            className: "button is-light is-medium mb-3",
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

export interface TagInfo {
  label: string;
  className?: string;
}

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
  buttonProps?: LetterCardButtonProps;
  information: string[];
  tags?: TagInfo[];
};

const LetterCard: React.FC<LetterCardProps> = (props) => {
  return (
    <>
      <div className="jf-la-letter-card">
        <div className="m-6">
          {props.tags && (
            <div className="jf-la-letter-card-tags mb-1">
              {props.tags.map((tag, i) => (
                <span key={`tag-${i}`} className={`tag ${tag.className}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          <ResponsiveElement desktop="h4" touch="h3">
            {props.title}
          </ResponsiveElement>
          <div className="jf-la-letter-time mb-5">
            <div className="jf-clock-icon">
              <StaticImage
                ratio="is-12x12"
                src={getLaLetterBuilderImageSrc("clock")}
                alt={li18n._(t`Estimated time to complete`)}
              />
            </div>
            <span className="is-small">{props.time_mins} mins</span>
          </div>
          <p className="mb-3">{props.text}</p>
          <p className="is-small mb-6">
            {li18n._(t`California residents only`)}
          </p>
          {props.buttonProps && <CallToAction {...props.buttonProps} />}
          {props.children}
        </div>
        <hr />
        <InformationNeeded
          id={props.title.toLowerCase()}
          information={props.information}
        />
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
      <StaticImage
        ratio="is-16x16"
        src="frontend/img/external-link.svg"
        alt=""
      />
    </OutboundLink>
  );
}

type InformationNeededProps = {
  id: string;
  information: string[];
};

export function InformationNeeded({ id, information }: InformationNeededProps) {
  const listItems = information.map((item, i) => <li key={i}>{item}</li>);
  return (
    <Accordion
      question={li18n._(t`What information will I need?`)}
      questionClassName="is-small"
      onClick={(isExpanded) =>
        logEvent("ui.accordion.click", {
          label: `${id}-info-needed`,
          isExpanded,
        })
      }
    >
      <ul>{listItems}</ul>
    </Accordion>
  );
}

const createLetterTags = [
  { label: li18n._(t`free`), className: "is-yellow" },
  { label: li18n._(t`no printing`), className: "is-pink" },
];

export const CreateLetterCard: React.FC = (props) => {
  const { session } = useContext(AppContext);
  const createNewLetter =
    !!session.phoneNumber && !session.hasHabitabilityLetterInProgress;

  return (
    <SessionUpdatingFormSubmitter
      mutation={LaLetterBuilderCreateLetterMutation}
      initialState={{}}
      onSuccessRedirect={() => {
        logEvent("latenants.letter.create", {
          letterType: "HABITABILITY" as LetterChoice,
        });
        return LaLetterBuilderRouteInfo.locale.habitability.issues.prefix;
      }}
    >
      {(sessionCtx) => (
        <LetterCard
          title={li18n._(t`Notice to Repair`)}
          time_mins={15}
          text={li18n._(
            t`Write your landlord a letter to formally document your request for repairs.`
          )}
          tags={createLetterTags}
          information={repairsInformationNeeded}
          buttonProps={
            !createNewLetter
              ? {
                  to: LaLetterBuilderRouteInfo.locale.habitability.latestStep,
                  className:
                    "button jf-is-next-button is-primary is-medium mb-3",
                  text: li18n._(t`Start letter`),
                }
              : undefined
          }
        >
          {createNewLetter && (
            <div className="start-letter-button jf-card-button">
              <NextButton
                isLoading={sessionCtx.isLoading}
                label={li18n._(t`Start letter`)}
              />
            </div>
          )}
        </LetterCard>
      )}
    </SessionUpdatingFormSubmitter>
  );
};
