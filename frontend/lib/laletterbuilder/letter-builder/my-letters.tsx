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
    <>
      <p>Your Letters</p>
      <div>
        {hasHabitabilityLetterInProgress ? (
          <Link
            to={LaLetterBuilderRouteInfo.locale.habitability.issues.prefix}
            className="button jf-is-next-button is-primary is-medium"
          >
            {li18n._(t`Continue my letter`)}
          </Link>
        ) : (
          <SessionUpdatingFormSubmitter
            mutation={LaLetterBuilderCreateLetterMutation}
            initialState={{}}
            onSuccessRedirect={
              LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
            }
          >
            {(sessionCtx) => (
              <NextButton
                isLoading={sessionCtx.isLoading}
                label={li18n._(t`Start a habitability letter`)}
              />
            )}
          </SessionUpdatingFormSubmitter>
        )}
      </div>
    </>
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
