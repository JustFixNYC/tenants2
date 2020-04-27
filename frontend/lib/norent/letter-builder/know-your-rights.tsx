import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { BackButton } from "../../ui/buttons";
import { getUSStateChoiceLabels } from "../../../../common-data/us-state-choices";
import {
  StatePartnerForBuilderEntry,
  getNorentMetadataForUSState,
  assertIsUSState,
  NorentMetadataForUSState,
} from "./national-metadata";
import { OutboundLink } from "../../analytics/google-analytics";

const StateWithoutProtectionsContent: React.FC<NorentMetadataForUSState> = (
  props
) => {
  return (
    <>
      <p>
        Unfortunately, we do not currently recommend sending a notice of
        non-payment to your landlord. Sending a notice could put you at risk.
      </p>

      <div className="content">
        <p>
          We’ve partnered with <PartnerLink {...props.partner} /> to provide
          additional support.
        </p>
      </div>
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

export const StateWithProtectionsContent: React.FC<NorentMetadataForUSState> = (
  props
) => (
  <>
    <p>{props.lawForBuilder.textOfLegislation}</p>

    <div className="content">
      <p>
        We’ve partnered with <PartnerLink {...props.partner} /> to provide
        additional support once you’ve sent your letter.
      </p>
    </div>
  </>
);

export const NorentLbKnowYourRights = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const scf = session.norentScaffolding;

  if (!scf?.state) {
    return (
      <p>
        Please <Link to={props.prevStep}>go back and choose a state</Link>.
      </p>
    );
  }

  const state = assertIsUSState(scf.state);
  const stateName = getUSStateChoiceLabels()[state];
  const metadata = getNorentMetadataForUSState(state);
  const hasNoProtections = metadata.lawForBuilder.stateWithoutProtections;

  return (
    <Page title="Know your rights">
      <h2 className="title">
        You're in <span className="has-text-info">{stateName}</span>
      </h2>

      {hasNoProtections ? (
        <StateWithoutProtectionsContent {...metadata} />
      ) : (
        <StateWithProtectionsContent {...metadata} />
      )}

      <br />
      <div className="buttons jf-two-buttons">
        <BackButton to={props.prevStep} />
        <Link
          to={props.nextStep}
          className="button is-primary is-medium jf-is-next-button"
        >
          Next
        </Link>
      </div>
    </Page>
  );
});
