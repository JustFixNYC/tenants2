import React, { useContext } from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link, Route } from "react-router-dom";
import { assertNotNull } from "../../util/util";
import { AppContext } from "../../app-context";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { LogoutMutation } from "../../queries/LogoutMutation";
import { NorentRoutes } from "../routes";
import { ChevronIcon } from "../faqs";

export const NorentLbWelcome: React.FC<ProgressStepProps> = (props) => (
  <Page title="Build your letter" className="content" withHeading="big">
    <p>
      In order to benefit from the eviction protections that local elected
      officials have put in place, you should notify your landlord of your
      non-payment for reasons related to COVID-19. In the event that your
      landlord tries to evict you, the courts will see this as a proactive step
      that helps establish your defense.
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
      <Link to={NorentRoutes.locale.home}>
        <button className="button is-light is-medium">Cancel</button>
      </Link>
      <Link to={assertNotNull(props.nextStep)}>
        <button className="button jf-is-next-button is-primary is-medium">
          Next
        </button>
      </Link>
    </div>
    <DebugArea />
  </Page>
);

const DebugArea = () => {
  const session = useContext(AppContext).session;

  return (
    <Route
      render={(props) => (
        <SessionUpdatingFormSubmitter
          mutation={LogoutMutation}
          initialState={{}}
          onSuccessRedirect={props.location.pathname}
        >
          {(ctx) => (
            <div className="content">
              <hr />
              <p>
                <code>DEBUG INFO</code>
              </p>
              {session.phoneNumber ? (
                <p>
                  Currently logged in with phone number: {session.phoneNumber}
                </p>
              ) : (
                <p>Not logged in.</p>
              )}
              <p>
                Last queried phone number:{" "}
                {session.lastQueriedPhoneNumber || "none"}
              </p>
              <button type="submit" className="button is-light">
                Clear session/logout
              </button>
            </div>
          )}
        </SessionUpdatingFormSubmitter>
      )}
    />
  );
};

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
