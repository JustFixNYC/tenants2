import React from "react";
import Page from "../../ui/page";
import { OutboundLink } from "../../analytics/google-analytics";
import { BackButton } from "../../ui/buttons";
import { Link } from "react-router-dom";
import { NorentOnboardingStep } from "./step-decorators";

const SAJE_WEBSITE_URL = "https://www.saje.net/";
const LA_LETTER_BUILDER_URL = "https://www.saje.net/norent/";

export const NorentLbLosAngelesRedirect = NorentOnboardingStep((props) => {
  return (
    <Page title="Los Angeles County">
      <h2 className="title">
        Looks like you're in{" "}
        <span className="has-text-info">Los Angeles County, California</span>
      </h2>
      <div className="content">
        <p>
          We’ve worked with the non-profit organization{" "}
          <OutboundLink
            href={SAJE_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            SAJE
          </OutboundLink>{" "}
          to provide you with a custom letter builder.
        </p>
        <p>
          If you're interested,{" "}
          <OutboundLink
            href={LA_LETTER_BUILDER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            check out the tool here
          </OutboundLink>
          .
        </p>
      </div>
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
