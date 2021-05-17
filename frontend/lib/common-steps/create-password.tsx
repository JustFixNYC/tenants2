import React from "react";
import { t } from "@lingui/macro";
import { BaseFormFieldProps, TextualFormField } from "../forms/form-fields";
import { li18n } from "../i18n-lingui";

// See project/settings.py for the list of password validators.
const PASSWORD_VALIDATATION_HINT = t`Must be at least 8 characters. Can't be all numbers.`;

type CreatePasswordProps = {
  passwordProps: BaseFormFieldProps<string>;
  confirmPasswordProps: BaseFormFieldProps<string>;
};

export class CreatePasswordFields extends React.Component<CreatePasswordProps> {
  render() {
    return (
      <React.Fragment>
        <TextualFormField
          label={li18n._(t`Create a password`)}
          type="password"
          labelHint={li18n._(PASSWORD_VALIDATATION_HINT)}
          {...this.props.passwordProps}
        />
        <TextualFormField
          label={li18n._(t`Please confirm your password`)}
          type="password"
          {...this.props.confirmPasswordProps}
        />
      </React.Fragment>
    );
  }
}
