import React, { useContext } from "react";

import { Trans, t } from "@lingui/macro";

import { AppContext } from "../../app-context";
import { DjangoChoices } from "../../common-data";
import { MultiCheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

export const ChooseLetterTypes = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  return (
    <Page
      title={li18n._(t`Letters you'd like to send`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>add extra content here</Trans>
      </p>
      <SessionUpdatingFormSubmitter
        mutation={LALetterBuilderSetLetterTypesMutation} // or whatever the mutation is called
        initialState={(s) => ({
          laLetterTypes: ["repairs"], // change this
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <MultiCheckboxFormField
              {...ctx.fieldPropsFor("laLetterTypes")}
              label={li18n._(t`Letter Types`)}
              choices={getLetterTypeChoices(session.laLetterTypeChoices)}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

function getLetterTypeChoices(
  letterTypes: AllSessionInfo["laLetterTypes"]
): DjangoChoices {
  // TODO: only show the letter types that are sendable based on the user's address (LA City, County, or CA)
  return [["repairs", "repairs"]];
}
