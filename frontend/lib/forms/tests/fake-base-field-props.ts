import { BaseFormFieldProps } from "../form-fields";

export function fakeBaseFieldProps<T>(props: Partial<BaseFormFieldProps<T>> & { value: T }): BaseFormFieldProps<T> {
  return {
    onChange: jest.fn(),
    name: 'foo',
    id: 'foo',
    isDisabled: false,
    ...props
  };
}
