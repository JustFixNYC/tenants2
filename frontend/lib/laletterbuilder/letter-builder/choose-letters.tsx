import React from "react";

import { t } from "@lingui/macro";

import { toDjangoChoices } from "../../common-data";
import { RadiosFormField } from "../../forms/form-fields";
import { li18n } from "../../i18n-lingui";
import { ProgressButtons } from "../../ui/buttons";
import {
  LetterChoices,
  getLetterChoiceLabels,
} from "../../../../common-data/la-letter-builder-letter-choices";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import Page from "../../ui/page";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { LaLetterBuilderChooseLetterMutation } from "../../queries/LaLetterBuilderChooseLetterMutation";

export const LaLetterBuilderChooseLetterStep = MiddleProgressStep((props) => {
  return (
    <Page title={li18n._(t`Letter type you'd like to send`)}>
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderChooseLetterMutation}
        initialState={(s) => ({
          letterType: s.laLetterDetails?.letterType || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <RadiosFormField
              {...ctx.fieldPropsFor("letterType")}
              label={li18n._(t`Letter Types`)}
              choices={toDjangoChoices(LetterChoices, getLetterChoiceLabels())}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
