import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { BackButton } from "../../ui/buttons";
import {
  getUSStateChoiceLabels,
  USStateChoice,
} from "../../../../common-data/us-state-choices";
import { getNorentMetadataForUSState } from "./national-metadata";
import { OutboundLink } from "../../analytics/google-analytics";

export const NorentLbKnowYourRights = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const state = session.norentScaffolding?.state as USStateChoice;

  // Content from national metadata:
  const legislation = getNorentMetadataForUSState(state)?.lawForBuilder
    ?.textOfLegislation;

  const partner = getNorentMetadataForUSState(state)?.partner;

  return (
    <Page title="Know your rights">
      <h2 className="title">
        You're in{" "}
        <span className="has-text-info">
          {state && getUSStateChoiceLabels()[state]}
        </span>
      </h2>

      {legislation && <p>{legislation}</p>}

      {partner && (
        <p>
          We’ve partnered with{" "}
          <OutboundLink
            href={partner.organizationWebsiteLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {partner.organizationName}
          </OutboundLink>{" "}
          to provide additional support once you’ve sent your letter.
        </p>
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
