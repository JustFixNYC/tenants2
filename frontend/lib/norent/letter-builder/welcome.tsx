import React, { useContext } from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link, Redirect } from "react-router-dom";
import { assertNotNull } from "../../util/util";
import { NorentRoutes } from "../routes";
import { ChevronIcon } from "../faqs";
import { SimpleClearSessionButton } from "../../forms/clear-session-button";
import { AppContext } from "../../app-context";
import { hasNorentLetterBeenSentForThisRentPeriod } from "./step-decorators";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";

const WelcomePage: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);
  return (
    <Page
      title={
        session.phoneNumber
          ? li18n._(t`Welcome back!`)
          : li18n._(t`Build your letter`)
      }
      className="content"
      withHeading="big"
    >
      {session.phoneNumber ? (
        <p>
          <Trans>
            Looks like you've been here before. Click "Next" to be taken to
            where you left off.
          </Trans>
        </p>
      ) : (
        <>
          <p>
            <Trans id="norent.introductionToLetterBuilderSteps">
              In order to benefit from the eviction protections that local
              elected officials have put in place, you should notify your
              landlord of your non-payment for reasons related to COVID-19.{" "}
              <span className="has-text-weight-semibold">
                In the event that your landlord tries to evict you, the courts
                will see this as a proactive step that helps establish your
                defense.
              </span>
            </Trans>
          </p>
          <Trans id="norent.outlineOfLetterBuilderSteps">
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
                  your landlord or management company’s mailing and/or email
                  address
                </p>
              </li>
            </ul>
          </Trans>
        </>
      )}
      <div className="buttons jf-two-buttons">
        <SimpleClearSessionButton to={NorentRoutes.locale.home} />
        <Link
          to={assertNotNull(props.nextStep)}
          className="button jf-is-next-button is-primary is-medium"
        >
          <Trans>Next</Trans>
        </Link>
      </div>
    </Page>
  );
};

export const NorentLbWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);
  // Note that we can't put this in the step definition as an `isCompleted`
  // because some steps in the flow expect a previous step, and this
  // is our book-end.  However, we know that the confirmation page has
  // no need for a "previous" button so we can just go straight to it
  // if we know the user has sent a letter, without requiring them
  // to see this step, which would just be confusing.
  if (hasNorentLetterBeenSentForThisRentPeriod(session)) {
    return <Redirect to={assertNotNull(props.nextStep)} />;
  }
  return <WelcomePage {...props} />;
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
