import React from "react";
import { SelectFormField, ChoiceFormFieldProps } from "./form-fields";
import { toDjangoChoices } from "../common-data";
import {
  USStateChoices,
  getUSStateChoiceLabels,
} from "../../../common-data/us-state-choices";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

export const USStateFormField: React.FC<Omit<
  ChoiceFormFieldProps,
  "label" | "choices"
>> = (props) => (
  <SelectFormField
    {...props}
    choices={toDjangoChoices(USStateChoices, getUSStateChoiceLabels())}
    label={li18n._(t`State`)}
  />
);
