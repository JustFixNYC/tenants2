import React from "react";
import { t } from "@lingui/macro";
import {
  BaseFormFieldProps,
  TextualFormField,
  LabelRenderer,
} from "../forms/form-fields";
import { li18n } from "../i18n-lingui";

type CreatePasswordProps = {
  passwordProps: BaseFormFieldProps<string>;
  confirmPasswordProps: BaseFormFieldProps<string>;
  renderPasswordLabel?: LabelRenderer;
};

export class CreatePasswordFields extends React.Component<CreatePasswordProps> {
  render() {
    return (
      <React.Fragment>
        <TextualFormField
          label={li18n._(t`Create a password`)}
          type="password"
          renderLabel={this.props.renderPasswordLabel}
          labelHint={li18n._(
            t`Must be at least 8 characters. Can't be all numbers.`
          )}
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
