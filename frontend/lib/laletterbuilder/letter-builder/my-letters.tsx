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

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  const hasLetterInProgress = userHasHabitabilityLetterInProgress();

  return (
    <Page title={li18n._(t`My letters`)} withHeading="big" className="content">
      <p>Your Letters</p>
      <div>
        {hasLetterInProgress ? (
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
    </Page>
  );
};

function userHasHabitabilityLetterInProgress(): boolean {
  // TODO: fetch all letters for a user of type habitability. if there's one that's not 'sent', return true.
  return false;
}
