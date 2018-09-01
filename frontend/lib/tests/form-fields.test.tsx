import React from 'react';
import { BaseFormFieldProps, TextualFormFieldProps, TextualFormField, ChoiceFormFieldProps, SelectFormField, BooleanFormFieldProps, CheckboxFormField } from "../form-fields";
import { shallow } from "enzyme";

function baseFieldProps<T>(props: Partial<BaseFormFieldProps<T>> & { value: T }): BaseFormFieldProps<T> {
  return {
    onChange: jest.fn(),
    name: 'foo',
    isDisabled: false,
    ...props
  };
}

describe('TextualFormField', () => {
  const makeButton = (props: Partial<TextualFormFieldProps> = {}) => {
    const defaultProps: TextualFormFieldProps = {
      ...baseFieldProps({ value: '' }),
      label: 'Foo'
    };
    return shallow(
      <TextualFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('renders properly when it has no errors', () => {
    const html = makeButton().html();
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('is-danger');
  });

  it('renders properly when it has errors', () => {
    const html = makeButton({ errors: ['this cannot be blank'] }).html();
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain('is-danger');
  });
});

describe('SelectFormField', () => {
  const makeSelect = (props: Partial<ChoiceFormFieldProps> = {}) => {
    const defaultProps: ChoiceFormFieldProps = {
      ...baseFieldProps({ value: '' }),
      choices: [
        ['BAR', 'Bar'],
        ['BAZ', 'Baz']
      ],
      label: 'Foo'
    };
    return shallow(
      <SelectFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('renders properly when it has no errors', () => {
    const html = makeSelect().html();
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('is-danger');
  });

  it('renders properly when it has errors', () => {
    const html = makeSelect({ errors: ['this cannot be blank'] }).html();
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain('is-danger');
  });
});

describe('CheckboxFormField', () => {
  const makeCheckbox = (props: Partial<BooleanFormFieldProps> = {}) => {
    const defaultProps: BooleanFormFieldProps = {
      ...baseFieldProps({ value: false }),
      children: 'Foo'
    };
    return shallow(
      <CheckboxFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('renders properly when it has no errors', () => {
    const html = makeCheckbox().html();
    expect(html).toContain('aria-invalid="false"');
  });

  it('renders properly when it has errors', () => {
    const html = makeCheckbox({ errors: ['this must be checked'] }).html();
    expect(html).toContain('aria-invalid="true"');
  });
});
