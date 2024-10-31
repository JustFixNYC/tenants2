import React from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { ReliefAttemptsMutation } from "../queries/ReliefAttemptsMutation";
import { YesNoRadiosFormField } from "../forms/yes-no-radios-form-field";
import { ProgressButtons } from "../ui/buttons";
import { toStringifiedNullBool } from "../forms/form-input-converter";
import { MiddleProgressStep } from "../progress/progress-step-route";

const WorkOrdersPage = MiddleProgressStep((props) => (
  <Page title="Work order repairs ticket">
    <div>
      <h1 className="title is-4 is-spaced">Work order repairs ticket</h1>
      <p className="subtitle is-6">
        Enter at least one work ticket number. We’ll include these in your
        letter so management can see the issues you’ve already reported.{" "}
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
              label="Have you previously called 311 with no results?"
            />
            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </div>
  </Page>
));

export default WorkOrdersPage;
