import React from "react";
import {
  ConditionalFormField,
  hideByDefault,
} from "../../forms/conditional-form-fields";
import { TextualFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_FALSE,
  YES_NO_RADIOS_TRUE,
} from "../../forms/yes-no-radios-form-field";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { EvictionFreeIndexNumberMutation } from "../../queries/EvictionFreeIndexNumberMutation";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

export const EvictionFreeIndexNumber = MiddleProgressStep((props) => {
  return (
    <Page
      title="Do you have a current eviction court case?"
      withHeading="big"
      className="content"
    >
      <SessionUpdatingFormSubmitter
        mutation={EvictionFreeIndexNumberMutation}
        initialState={(s) => ({
          hasCurrentCase: s.hardshipDeclarationDetails?.indexNumber
            ? YES_NO_RADIOS_TRUE
            : YES_NO_RADIOS_FALSE,
          indexNumber: s.hardshipDeclarationDetails?.indexNumber || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => {
          const yesNoProps = ctx.fieldPropsFor("hasCurrentCase");
          const indexNumberProps = hideByDefault(
            ctx.fieldPropsFor("indexNumber")
          );

          if (yesNoProps.value === YES_NO_RADIOS_TRUE) {
            indexNumberProps.hidden = false;
          }

          return (
            <>
              <YesNoRadiosFormField {...yesNoProps} label="" />
              <ConditionalFormField {...indexNumberProps}>
                <>
                  <p>
                    We'll need to add your case's index number to your
                    declaration.
                  </p>
                  <TextualFormField
                    {...indexNumberProps}
                    label="Your case's index number"
                  />
                </>
              </ConditionalFormField>
              <ProgressButtons
                isLoading={ctx.isLoading}
                back={props.prevStep}
              />
            </>
          );
        }}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
