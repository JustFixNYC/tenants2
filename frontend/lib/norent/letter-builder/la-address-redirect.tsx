import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { OutboundLink } from "../../analytics/google-analytics";
import { BackButton } from "../../ui/buttons";

const SAJE_WEBSITE_URL = "https://www.saje.net/";
const LA_LETTER_BUILDER_URL =
  "https://app.norent.org/?i=docassemble.playground1:BrQm8N3wh4C8FPDk.yml&reset=1&key=J2NsHXy22cyUyMoTrHq1nujrX&_ga=2.208244050.136157993.1587673131-1106448515.1585681365";

export const NorentLbLaRedirect = MiddleProgressStep((props) => {
  return (
    <Page title="Los Angeles County">
      <h2 className="title">
        Looks like you're in{" "}
        <span className="has-text-info">Los Angeles County, California</span>
      </h2>
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
        Click <span className="has-text-weight-semibold">Start</span> to be
        redirected to the new tool.
      </p>
      <br />
      <div className="buttons jf-two-buttons">
        <BackButton to={props.prevStep} />
        <OutboundLink
          className="button is-primary is-medium jf-is-next-button"
          href={LA_LETTER_BUILDER_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Start
        </OutboundLink>
      </div>
    </Page>
  );
});
