import React from "react";
import { SelectFormField, ChoiceFormFieldProps } from "./form-fields";
import { toDjangoChoices } from "../common-data";
import {
  USStateChoices,
  getUSStateChoiceLabels,
} from "../../../common-data/us-state-choices";

export const USStateFormField: React.FC<Omit<
  ChoiceFormFieldProps,
  "label" | "choices"
>> = (props) => (
  <SelectFormField
    {...props}
    choices={toDjangoChoices(USStateChoices, getUSStateChoiceLabels())}
    label="State"
  />
);
