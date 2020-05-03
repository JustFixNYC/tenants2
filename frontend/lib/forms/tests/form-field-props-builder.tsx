import { BaseFormFieldProps } from "../form-fields";
import { FormError } from "../form-errors";

type StaticFormFieldProps<T> = Omit<BaseFormFieldProps<T>, "onChange">;

type MockFormFieldProps<T> = BaseFormFieldProps<T> & { onChange: jest.Mock };

const DEFAULT_FORM_FIELD_PROPS: Omit<StaticFormFieldProps<unknown>, "value"> = {
  name: "my field",
  id: "myfield",
  isDisabled: false,
};

/**
 * An attempt to encapsulate the creation of form field props
 * in a Builder pattern:
 *
 *   https://en.wikipedia.org/wiki/Builder_pattern
 */
export class FormFieldPropsBuilder<T> {
  constructor(readonly baseProps: StaticFormFieldProps<T>) {}

  withValue(value: T) {
    return this.with({ value });
  }

  with(overrides: Partial<StaticFormFieldProps<T>>) {
    return new FormFieldPropsBuilder({
      ...this.baseProps,
      ...overrides,
    });
  }

  withError(message: string) {
    return this.with({
      errors: [new FormError(message), ...(this.baseProps.errors || [])],
    });
  }

  build(): MockFormFieldProps<T> {
    return {
      onChange: jest.fn(),
      ...this.baseProps,
    };
  }
}

/**
 * Create a form field props builder with the given initial
 * form field value (which also determines the type of the field).
 */
export function createFormFieldPropsBuilder<T>(value: T) {
  return new FormFieldPropsBuilder<T>({
    ...DEFAULT_FORM_FIELD_PROPS,
    value,
  });
}
