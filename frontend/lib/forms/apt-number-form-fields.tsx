import React from "react";

import {
  BaseFormFieldProps,
  TextualFormField,
  CheckboxFormField,
} from "./form-fields";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

type AptNumberFieldsProps = {
  aptNumberProps: BaseFormFieldProps<string>;
  noAptNumberProps: BaseFormFieldProps<boolean>;
  aptNumberLabel?: string;
};

type AptNumberFormInput = {
  aptNumber: string;
  noAptNumber: boolean;
};

export const createAptNumberFormInput = (
  aptNumber: string | null | undefined
): AptNumberFormInput => {
  return {
    aptNumber: aptNumber || "",
    noAptNumber: typeof aptNumber == "string" ? !aptNumber : false,
  };
};

export const AptNumberFormFields: React.FC<AptNumberFieldsProps> = (props) => {
  return (
    <div className="jf-related-text-field-with-checkbox">
      <TextualFormField
        label={props.aptNumberLabel || li18n._(t`Apartment number`)}
        autoComplete="address-line2 street-address"
        {...props.aptNumberProps}
      />
      <CheckboxFormField {...props.noAptNumberProps}>
        <Trans>I have no apartment number</Trans>
      </CheckboxFormField>
    </div>
  );
};
