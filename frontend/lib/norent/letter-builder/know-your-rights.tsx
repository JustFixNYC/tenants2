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
import { OutboundLink } from "../../ui/outbound-link";
import { getStatesWithLimitedProtectionsFAQSectionURL } from "../faqs";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentOptInToRttcCommsMutation } from "../../queries/NorentOptInToRttcCommsMutation";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { CheckboxFormField } from "../../forms/form-fields";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { STATE_LOCALIZED_RESOURCES } from "../data/state-localized-resources";
import {
  LocalizedOutboundLinkProps,
  LocalizedOutboundLinkList,
} from "../../ui/localized-outbound-link";
import { SendCDCDeclarationBlurb } from "../data/faqs-content";

/**
 * The default value of the RTTC checkbox; this will essentially determine if RTTC
 * communications are opt-in or opt-out.
 */
const RTTC_CHECKBOX_DEFAULT = true;

type ProtectionsContentComponent = React.FC<
  NorentMetadataForUSState & {
    links?: LocalizedOutboundLinkProps[];
    rttcCheckbox: JSX.Element;
  }
>;

const getRttcValue = (s: AllSessionInfo) =>
  s.onboardingInfo?.canReceiveRttcComms ??
  s.onboardingScaffolding?.canReceiveRttcComms;

export function hasUserSeenRttcCheckboxYet(s: AllSessionInfo): boolean {
  return typeof getRttcValue(s) === "boolean" ? true : false;
}

const StateLocalResources: React.FC<{ links: LocalizedOutboundLinkProps[] }> = (
  props
) => (
  <>
    <p>
      <Trans>Check out these valuable resources for your state:</Trans>
    </p>
    <LocalizedOutboundLinkList {...props} />
  </>
);

const StateWithoutProtectionsContent: ProtectionsContentComponent = (props) => {
  return (
    <>
      {props.links ? (
        <>
          <p>
            <Trans>
              Unfortunately, we do not currently recommend sending a notice of
              non-payment to your landlord. Sending a notice could put you at
              risk of harassment.
            </Trans>{" "}
            <Link to={getStatesWithLimitedProtectionsFAQSectionURL()}>
              <Trans>Learn more.</Trans>
            </Link>
          </p>

          <StateLocalResources links={props.links} />
        </>
      ) : (
        <p>
          <Trans>
            Unfortunately, we do not currently recommend sending this notice of
            non-payment to your landlord. <SendCDCDeclarationBlurb />
          </Trans>
        </p>
      )}

      <p>
        <Trans>
          We’ve partnered with{" "}
          <OneOrTwoPartnerLinks localStatePartner={props.partner} /> to provide
          additional support.
        </Trans>
      </p>

      {props.rttcCheckbox}

      <p>
        <Trans>
          If you’d still like to create an account, we can send you updates in
          the future.
        </Trans>
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

const OneOrTwoPartnerLinks = (props: {
  localStatePartner?: StatePartnerForBuilderEntry;
}) => (
  <>
    {props.localStatePartner && (
      <>
        <PartnerLink {...props.localStatePartner} /> <Trans>and</Trans>{" "}
      </>
    )}
    <PartnerLink {...DefaultStatePartnerForBuilder} />
  </>
);

export const AmiCalculatorLink: React.FC = () => (
  <>
    <OutboundLink href="https://housing.ca.gov/tenant/eligibilityquiz.html">
      <Trans>Find out if my household income is below 80% AMI</Trans>{" "}
    </OutboundLink>
    <em>
      <Trans>(use your “gross” or before tax income)</Trans>
    </em>
  </>
);

export const StateWithProtectionsContent: ProtectionsContentComponent = (
  props
) => (
  <>
    {
      /* The State of California requires more detailed legal info, including hyperlinks,
    so let's override the default legislation text in that case:
    */
      props.lawForBuilder.textOfLegislation?.includes("California") ? (
        <>
          <p>
            <Trans id="norent.letter.lacountydisclaimer2022v3">
              As required under section VI.A.1 of the January 25, 2022
              Resolution of the Board of Supervisors of the County of Los
              Angeles Further Amending and Restating the County of Los Angeles
              COVID-19 Tenant Protections Resolution:
            </Trans>
          </p>
          <p>
            <Trans>
              These protections apply to tenants whose household income, in a
              particular month, is below 80% of Area Median Income (AMI).
            </Trans>
          </p>
          <p>
            <AmiCalculatorLink />
          </p>
          <p>
            <Trans>
              Deliver a NoRent letter to your landlord within seven (7) days of
              your rent being due.
            </Trans>
          </p>
          <p>
            <Trans>
              If you have received an unlawful detainer or have questions about
              your rights as a tenant please contact{" "}
              <PartnerLink
                organizationName="Stay Housed LA"
                organizationWebsiteLink="https://www.stayhousedla.org/es/referral"
              />
              .
            </Trans>
          </p>
        </>
      ) : (
        <p>{props.lawForBuilder.textOfLegislation}</p>
      )
    }
    {props.links && <StateLocalResources links={props.links} />}
    <p>
      <Trans>
        We’ve partnered with{" "}
        <OneOrTwoPartnerLinks localStatePartner={props.partner} /> to provide
        additional support once you’ve sent your letter.
      </Trans>
    </p>
    {props.rttcCheckbox}
  </>
);

export const NorentLbKnowYourRights = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const rawState =
    session.onboardingScaffolding?.state || session.onboardingInfo?.state;

  if (!rawState) {
    return (
      <p>
        <Trans>
          Please <Link to={props.prevStep}>go back and choose a state</Link>.
        </Trans>
      </p>
    );
  }

  const state = assertIsUSState(rawState);
  const stateName = getUSStateChoiceLabels()[state];
  const metadata = getNorentMetadataForUSState(state);
  const hasNoProtections = metadata.lawForBuilder.stateWithoutProtections;

  return (
    <Page title={li18n._(t`Know your rights`)}>
      <h2 className="title">
        <Trans>
          You're in <span className="has-text-info">{stateName}</span>
        </Trans>
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
              <Trans>
                Right to the City Alliance can contact me to provide additional
                support.
              </Trans>
            </CheckboxFormField>
          );

          const ProtectionsComponent = hasNoProtections
            ? StateWithoutProtectionsContent
            : StateWithProtectionsContent;

          return (
            <>
              <div className="content">
                <ProtectionsComponent
                  {...metadata}
                  links={STATE_LOCALIZED_RESOURCES[state]}
                  rttcCheckbox={checkbox}
                />
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
