import React, { useContext } from "react";
import { Link } from "react-router-dom";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { LaLetterBuilderCreateLetterMutation } from "../../queries/LaLetterBuilderCreateLetterMutation";
import { NextButton } from "../../ui/buttons";
import { WelcomePage } from "../../common-steps/welcome";
import { AppContext } from "../../app-context";

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title={li18n._(t`My letters`)} withHeading="big" className="content">
      <MyLettersContent />
    </Page>
  );
};

const MyLettersContent: React.FC = (props) => {
  return (
    <div className="jf-my-letters">
      <p className="subtitle">See all your finished and unfinished letters</p>

      <CreateOrContinueLetter />

      <Link
        to={LaLetterBuilderRouteInfo.locale.chooseLetter}
        className="button new-letter-button is-light is-medium "
      >
        {li18n._(t`Start letter`)}
      </Link>
    </div>
  );
};

const CreateOrContinueLetter: React.FC = (props) => {
  const { session } = useContext(AppContext);

  return (
    <SessionUpdatingFormSubmitter
      mutation={LaLetterBuilderCreateLetterMutation}
      initialState={{}}
      onSuccessRedirect={
        LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
      }
    >
      {(sessionCtx) => (
        <div className="my-letters-box">
          <h3>Notice to repair letter</h3>
          {session.hasHabitabilityLetterInProgress ? (
            <>
              <p>In progress</p>
              <p>
                Document repairs needed in your home, and send a formal request
                to your landlord
              </p>
              <div className="start-letter-button">
                <Link
                  to={
                    LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
                  }
                  className="button jf-is-next-button is-primary is-medium"
                >
                  {li18n._(t`Continue letter`)}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>Start your letter now</p>
              <div className="start-letter-button">
                <NextButton
                  isLoading={sessionCtx.isLoading}
                  label={li18n._(t`Start letter`)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </SessionUpdatingFormSubmitter>
  );
};

export const WelcomeMyLetters: React.FC<ProgressStepProps> = (props) => {
  return (
    <WelcomePage
      {...props}
      title={li18n._(t`My letters`)}
      // We need a Welcome page for navigation back from the first flow step
      // to work, but always skip it.
      hasFlowBeenCompleted={true}
    >
      <MyLettersContent />
    </WelcomePage>
  );
};
