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
import { LALetterBuilderOnboardingStep } from "./step-decorators";
import {
  BlankLALetterBuilderChooseLetterTypeInput,
  LaLetterBuilderChooseLetterTypeMutation,
} from "../../queries/LaLetterBuilderChooseLetterTypeMutation";

export const ChooseLetters = LALetterBuilderOnboardingStep((props) => {
  return (
    <Page title={li18n._(t`Letters you'd like to send`)}>
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderChooseLetterTypeMutation}
        initialState={{
          ...BlankLALetterBuilderChooseLetterTypeInput,
        }}
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
