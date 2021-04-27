import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Link, Redirect } from "react-router-dom";
import { AppContext } from "../app-context";
import { SimpleClearSessionButton } from "../forms/clear-session-button";
import { getGlobalSiteRoutes } from "../global-site-routes";
import { li18n } from "../i18n-lingui";
import { ProgressStepProps } from "../progress/progress-step-route";
import Page from "../ui/page";
import { assertNotNull } from "@justfixnyc/util";

export type WelcomePageProps = ProgressStepProps & {
  /**
   * Whether or not the flow this welcome page is for has already
   * been completed.
   */
  hasFlowBeenCompleted: boolean;

  /** The page's title, when the user has never been here before. */
  title: string;

  /** The page's content, when the user has never been here before. */
  children: JSX.Element;
};

/**
 * A welcome page for a builder flow. If the process it's for has
 * already been completed, it automatically forwards the user
 * to the next step (which is presumably the confirmation page).
 *
 * If the user has been here before, it greets the user and tells
 * them to click next.
 *
 * Otherwise, it shows the given introductory content to the
 * user and invites them to start the flow.
 */
export const WelcomePage: React.FC<WelcomePageProps> = (props) => {
  const { session } = useContext(AppContext);
  const hasBeenHereBefore = !!session.phoneNumber;
  const title = hasBeenHereBefore ? li18n._(t`Welcome back!`) : props.title;
  const nextStep = assertNotNull(props.nextStep);

  // Note that we can't put this in the step definition as an `isCompleted`
  // because some steps in the flow expect a previous step, and this
  // is our book-end.  However, it's likely that future pages have
  // no need for a "previous" button so we can just go straight to them
  // if we know the user has sent a letter, without requiring them
  // to see this step, which would just be confusing.
  if (props.hasFlowBeenCompleted) {
    return <Redirect to={nextStep} />;
  }

  return (
    <Page title={title} className="content" withHeading="big">
      {session.phoneNumber ? (
        <p>
          <Trans>
            Looks like you've been here before. Click "Next" to be taken to
            where you left off.
          </Trans>
        </p>
      ) : (
        props.children
      )}
      <div className="buttons jf-two-buttons">
        <SimpleClearSessionButton to={getGlobalSiteRoutes().locale.home} />
        <Link
          to={nextStep}
          className="button jf-is-next-button is-primary is-medium"
        >
          {hasBeenHereBefore ? <Trans>Next</Trans> : <Trans>Start</Trans>}
        </Link>
      </div>
    </Page>
  );
};
