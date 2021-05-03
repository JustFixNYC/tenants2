import { TextualFormField } from "../forms/form-fields";
import { li18n } from "../i18n-lingui";


export function CreatePasswordFields(
  props: 
): JSX.Element {
  {(ctx) => 
    return (
      <>
      <TextualFormField
        label={li18n._(t`Create a password`)}
        type="password"
        labelHint={li18n._(t`Must be at least 8 characters. Can't be all numbers.`)}
        {...ctx.fieldPropsFor("password")}
      />
      <TextualFormField
        label="Please confirm your password"
        type="password"
        {...ctx.fieldPropsFor("confirmPassword")}
      />
    </>
    );
  }
}
