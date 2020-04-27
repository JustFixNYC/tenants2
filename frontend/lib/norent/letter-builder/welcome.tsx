import React from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { assertNotNull } from "../../util/util";
import { NorentRoutes } from "../routes";
import { ChevronIcon } from "../faqs";
import { SimpleClearSessionButton } from "../../forms/clear-session-button";

export const NorentLbWelcome: React.FC<ProgressStepProps> = (props) => (
  <Page title="Build your letter" className="content" withHeading="big">
    <p>
      In order to benefit from the eviction protections that local elected
      officials have put in place, you should notify your landlord of your
      non-payment for reasons related to COVID-19.{" "}
      <span className="has-text-weight-semibold">
        In the event that your landlord tries to evict you, the courts will see
        this as a proactive step that helps establish your defense.
      </span>
    </p>
    <p>
      In the next few steps, we’ll build your letter using the following
      information. Have this information on hand if possible:
    </p>
    <ul>
      <li>
        <p>your phone number, email address, and residence</p>
      </li>
      <li>
        <p>
          your landlord or management company’s mailing and/or email address
        </p>
      </li>
    </ul>
    <div className="buttons jf-two-buttons">
      <SimpleClearSessionButton to={NorentRoutes.locale.home} />
      <Link
        to={assertNotNull(props.nextStep)}
        className="button jf-is-next-button is-primary is-medium"
      >
        Next
      </Link>
    </div>
  </Page>
);

export const LetterBuilderAccordion = (props: {
  question: string;
  children: React.ReactNode;
}) => (
  <div className="jf-accordion-item jf-space-below-2rem">
    <details className="has-text-left jf-space-below-2rem">
      <summary>
        <div className="media">
          <div className="media-content">
            <span className="is-size-6 has-text-primary jf-has-text-underline">
              {props.question}
            </span>
          </div>
          <div className="media-right">
            <ChevronIcon />
          </div>
        </div>
      </summary>
      {props.children}
    </details>
  </div>
);
