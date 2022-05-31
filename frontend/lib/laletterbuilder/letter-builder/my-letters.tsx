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
  const { session } = useContext(AppContext);
  const { hasHabitabilityLetterInProgress } = session;
  return (
    <div className="jf-my-letters">
      <p className="subtitle">See all your finished and unfinished letters</p>

      {hasHabitabilityLetterInProgress ? (
        <div className="my-letters-box">
          <h3>Habitability letter</h3>
          <p>In progress</p>
          <div className="start-letter-button">
            <Link
              to={LaLetterBuilderRouteInfo.locale.habitability.issues.prefix}
              className="button jf-is-next-button is-primary is-medium"
            >
              {li18n._(t`Continue my letter`)}
            </Link>
          </div>
        </div>
      ) : (
        <SessionUpdatingFormSubmitter
          mutation={LaLetterBuilderCreateLetterMutation}
          initialState={{}}
          onSuccessRedirect={
            LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
          }
        >
          {(sessionCtx) => (
            <div className="my-letters-box">
              <p>Start your habitability letter</p>
              <div className="start-letter-button">
                <NextButton
                  isLoading={sessionCtx.isLoading}
                  label={li18n._(t`Let's go`)}
                />
              </div>
            </div>
          )}
        </SessionUpdatingFormSubmitter>
      )}

      <Link
        to={LaLetterBuilderRouteInfo.locale.chooseLetter}
        className="button new-letter-button is-light is-medium "
      >
        {li18n._(t`Create a new letter`)}
      </Link>
    </div>
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
