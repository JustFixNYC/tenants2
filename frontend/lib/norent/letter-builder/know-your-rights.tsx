import React, { useContext } from "react";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { ProgressButtons } from "../../ui/buttons";
import { getUSStateChoiceLabels } from "../../../../common-data/us-state-choices";
import {
  StatePartnerForBuilderEntry,
  getNorentMetadataForUSState,
  assertIsUSState,
  NorentMetadataForUSState,
  DefaultStatePartnerForBuilder,
} from "./national-metadata";
import { OutboundLink } from "../../analytics/google-analytics";
import { getStatesWithLimitedProtectionsFAQSectionURL } from "../faqs";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentOptInToRttcCommsMutation } from "../../queries/NorentOptInToRttcCommsMutation";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { CheckboxFormField } from "../../forms/form-fields";
import { MiddleProgressStep } from "../../progress/progress-step-route";

/**
 * The default value of the RTTC checkbox; this will essentially determine if RTTC
 * communications are opt-in or opt-out.
 */
const RTTC_CHECKBOX_DEFAULT = true;

type ProtectionsContentComponent = React.FC<
  NorentMetadataForUSState & {
    rttcCheckbox: JSX.Element;
  }
>;

const getRttcValue = (s: AllSessionInfo) =>
  s.onboardingInfo?.canReceiveRttcComms ??
  s.norentScaffolding?.canReceiveRttcComms;

export function hasUserSeenRttcCheckboxYet(s: AllSessionInfo): boolean {
  return typeof getRttcValue(s) === "boolean" ? true : false;
}

const StateWithoutProtectionsContent: ProtectionsContentComponent = (props) => {
  return (
    <>
      <p>
        Unfortunately, we do not currently recommend sending a notice of
        non-payment to your landlord. Sending a notice could put you at risk.{" "}
        <Link to={getStatesWithLimitedProtectionsFAQSectionURL()}>
          Learn more.
        </Link>
      </p>

      <p>
        We’ve partnered with{" "}
        <OneOrMorePartnerLinks localStatePartner={props.partner} /> to provide
        additional support.
      </p>

      {props.rttcCheckbox}

      <p>
        If you’d still like to create an account, we can send you updates in the
        future.
      </p>
    </>
  );
};

export const PartnerLink: React.FC<StatePartnerForBuilderEntry> = (props) => (
  <OutboundLink
    href={props.organizationWebsiteLink}
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.organizationName}
  </OutboundLink>
);

const OneOrMorePartnerLinks = (props: {
  localStatePartner?: StatePartnerForBuilderEntry;
}) => (
  <>
    {props.localStatePartner && (
      <>
        <PartnerLink {...props.localStatePartner} /> and{" "}
      </>
    )}
    <PartnerLink {...DefaultStatePartnerForBuilder} />
  </>
);

export const StateWithProtectionsContent: ProtectionsContentComponent = (
  props
) => (
  <>
    <p>{props.lawForBuilder.textOfLegislation}</p>
    <p>
      We’ve partnered with{" "}
      <OneOrMorePartnerLinks localStatePartner={props.partner} /> to provide
      additional support once you’ve sent your letter.
    </p>
    {props.rttcCheckbox}
  </>
);

export const NorentLbKnowYourRights = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const rawState =
    session.norentScaffolding?.state || session.onboardingInfo?.state;

  if (!rawState) {
    return (
      <p>
        Please <Link to={props.prevStep}>go back and choose a state</Link>.
      </p>
    );
  }

  const state = assertIsUSState(rawState);
  const stateName = getUSStateChoiceLabels()[state];
  const metadata = getNorentMetadataForUSState(state);
  const hasNoProtections = metadata.lawForBuilder.stateWithoutProtections;

  return (
    <Page title="Know your rights">
      <h2 className="title">
        You're in <span className="has-text-info">{stateName}</span>
      </h2>

      <SessionUpdatingFormSubmitter
        mutation={NorentOptInToRttcCommsMutation}
        initialState={(s) => ({
          optIn: getRttcValue(s) ?? RTTC_CHECKBOX_DEFAULT,
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => {
          const checkbox = (
            <CheckboxFormField {...ctx.fieldPropsFor("optIn")}>
              Right to the City Alliance can contact me to provide additional
              support.
            </CheckboxFormField>
          );

          const ProtectionsComponent = hasNoProtections
            ? StateWithoutProtectionsContent
            : StateWithProtectionsContent;

          return (
            <>
              <div className="content">
                <ProtectionsComponent {...metadata} rttcCheckbox={checkbox} />
              </div>

              <ProgressButtons
                back={props.prevStep}
                isLoading={ctx.isLoading}
              />
            </>
          );
        }}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
