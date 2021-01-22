import React, { useState } from "react";
import {
  ConditionalFormField,
  hideByDefault,
} from "../../forms/conditional-form-fields";
import { BaseFormFieldProps, TextualFormField } from "../../forms/form-fields";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_TRUE,
} from "../../forms/yes-no-radios-form-field";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";

function useTemporaryFormFieldProps<T>(
  name: string,
  initialValue: T
): BaseFormFieldProps<T> {
  const [value, onChange] = useState(initialValue);
  const result: BaseFormFieldProps<T> = {
    onChange,
    value,
    name,
    isDisabled: false,
    id: name,
  };

  return result;
}

export const EvictionFreeIndexNumber = MiddleProgressStep((props) => {
  const titleQuestion = "Do you have a current eviction court case?";
  const yesNoProps = useTemporaryFormFieldProps("yesNo", "");
  const indexNumberProps = hideByDefault(
    useTemporaryFormFieldProps("indexNumber", "")
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
