import React from "react";
import { SelectFormField, ChoiceFormFieldProps } from "./form-fields";
import US_STATE_CHOICES from "../../../common-data/us-state-choices.json";
import { DjangoChoices } from "../common-data";

export const USStateFormField: React.FC<Omit<
  ChoiceFormFieldProps,
  "label" | "choices"
>> = (props) => (
  <SelectFormField
    {...props}
    choices={US_STATE_CHOICES as DjangoChoices}
    label="State"
  />
);
