import React from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { ReliefAttemptsMutation } from "../queries/ReliefAttemptsMutation";
import { YesNoRadiosFormField } from "../forms/yes-no-radios-form-field";
import { ProgressButtons } from "../ui/buttons";
import { toStringifiedNullBool } from "../forms/form-input-converter";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

const ReliefAttemptsPage = MiddleProgressStep((props) => (
  <Page title={li18n._(t`Previous attempts to get official help`)} withHeading>
    <div>
      <p className="subtitle is-6">
        <Trans id="justfix.LocReliefAttemptsBlurb">
          It is encouraged that you call 311 to report housing complaints
          directly with the City. By calling, you will trigger a formal
          inspection process that may lead to official violations being issued.
        </Trans>
      </p>
      <SessionUpdatingFormSubmitter
        mutation={ReliefAttemptsMutation}
        initialState={(session) => ({
          hasCalled311: toStringifiedNullBool(
            session.onboardingInfo?.hasCalled311 ?? null
          ),
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <YesNoRadiosFormField
              {...ctx.fieldPropsFor("hasCalled311")}
              label={li18n._(
                t`Have you previously called 311 with no results?`
              )}
            />
            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </div>
  </Page>
));

export default ReliefAttemptsPage;
