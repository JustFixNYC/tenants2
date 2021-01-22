import React from "react";
import {
  ConditionalFormField,
  hideByDefault,
} from "../../forms/conditional-form-fields";
import { TextualFormField } from "../../forms/form-fields";
import { usePrototypingFormFieldProps } from "../../forms/prototyping";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_TRUE,
} from "../../forms/yes-no-radios-form-field";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";

export const EvictionFreeIndexNumber = MiddleProgressStep((props) => {
  const titleQuestion = "Do you have a current eviction court case?";
  const yesNoProps = usePrototypingFormFieldProps("yesNo", "");
  const indexNumberProps = hideByDefault(
    usePrototypingFormFieldProps("indexNumber", "")
  );

  if (yesNoProps.value === YES_NO_RADIOS_TRUE) {
    indexNumberProps.hidden = false;
  }

  return (
    <Page title={titleQuestion} withHeading="big" className="content">
      <form>
        <YesNoRadiosFormField {...yesNoProps} label={titleQuestion} />
        <ConditionalFormField {...indexNumberProps}>
          <>
            <p>
              We'll need to add your case's index number to your declaration.
            </p>
            <TextualFormField
              {...indexNumberProps}
              label="Your case's index number"
            />
          </>
        </ConditionalFormField>
        <ProgressButtonsAsLinks back={props.prevStep} next={props.nextStep} />
      </form>
    </Page>
  );
});
