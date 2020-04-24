import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { OutboundLink } from "../../analytics/google-analytics";
import { BackButton } from "../../ui/buttons";
import { Link } from "react-router-dom";

const SAJE_WEBSITE_URL = "https://www.saje.net/";
const LA_LETTER_BUILDER_URL =
  "https://app.norent.org/?i=docassemble.playground1:BrQm8N3wh4C8FPDk.yml&reset=1&key=J2NsHXy22cyUyMoTrHq1nujrX&_ga=2.208244050.136157993.1587673131-1106448515.1585681365";

export const NorentLbLosAngelesRedirect = MiddleProgressStep((props) => {
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
