import React from "react";
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

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  const hasLetterInProgress = userHasHabitabilityLetterInProgress();

  return (
    <Page title={li18n._(t`My letters`)} withHeading="big" className="content">
      <MyLettersContent hasLetterInProgress={hasLetterInProgress} />
    </Page>
  );
};

function userHasHabitabilityLetterInProgress(): boolean {
  // TODO: fetch all letters for a user of type habitability. if there's one that's not 'sent', return true.
  return false;
}

export type MyLettersProps = {
  hasLetterInProgress: boolean;
};

const MyLettersContent: React.FC<MyLettersProps> = (props) => (
  <>
    <p>Your Letters</p>
    <div>
      {props.hasLetterInProgress ? (
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
