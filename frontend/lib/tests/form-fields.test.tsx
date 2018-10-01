import React from 'react';
import { BaseFormFieldProps, TextualFormFieldProps, TextualFormField, ChoiceFormFieldProps, SelectFormField, BooleanFormFieldProps, CheckboxFormField, RadiosFormField, MultiChoiceFormFieldProps, MultiCheckboxFormField, toggleChoice, TextareaFormField, HiddenFormField } from "../form-fields";
import { shallow } from "enzyme";
import { DjangoChoices } from '../common-data';
import ReactTestingLibraryPal from './rtl-pal';

const CHOICES: DjangoChoices = [
  ['BAR', 'Bar'],
  ['BAZ', 'Baz']
];

function baseFieldProps<T>(props: Partial<BaseFormFieldProps<T>> & { value: T }): BaseFormFieldProps<T> {
  return {
    onChange: jest.fn(),
    name: 'foo',
    isDisabled: false,
    ...props
  };
}

function choiceFieldProps(props: Partial<ChoiceFormFieldProps> = {}): ChoiceFormFieldProps {
  return {
    ...baseFieldProps({ value: '' }),
    choices: CHOICES,
    label: 'Foo',
    ...props
  };
}

describe('TextualFormField', () => {
  const makeField = (props: Partial<TextualFormFieldProps> = {}) => {
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
    const html = makeField().html();
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('is-danger');
  });

  it('renders properly when it has errors', () => {
    const html = makeField({ errors: ['this cannot be blank'] }).html();
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain('is-danger');
  });
});

describe('TextualFormField with type="date"', () => {
  it('clears value when "clear" is clicked', () => {
    const onChange = jest.fn();
    const pal = new ReactTestingLibraryPal(
      <TextualFormField
        type="date"
        label="Boop"
        {...baseFieldProps({ value: '01/01/2011', onChange })}
      />
    );
    pal.clickButtonOrLink(/Clear/);
    expect(onChange.mock.calls).toEqual([['']]);
  });
});

describe('HiddenFormField', () => {
  const makeField = (props: Partial<BaseFormFieldProps<string>> = {}) => {
    const defaultProps: BaseFormFieldProps<string> = {
      ...baseFieldProps({ value: '' }),
    };
    return shallow(
      <HiddenFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('renders name and value attrs', () => {
    const html = makeField({ name: 'boop', value: 'blah' }).html();
    expect(html).toContain('name="boop"');
    expect(html).toContain('value="blah"');
  });

  it('throws an exception when it has errors', () => {
    expect(() =>
      makeField({ errors: ['this cannot be blank'] }).html()
    ).toThrow(/Hidden fields should have no errors, but "foo" does/);
  });
});

describe('TextareaFormField', () => {
  const makeField = (props: Partial<TextualFormFieldProps> = {}) => {
    const defaultProps: TextualFormFieldProps = {
      ...baseFieldProps({ value: '' }),
      label: 'Foo'
    };
    return shallow(
      <TextareaFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('renders name attr and sets value', () => {
    const html = makeField({ name: 'blarg', value: 'boof'}).html();
    expect(html).toContain('name="blarg"');
    expect(html).toContain('>boof</textarea>');
  });

  it('renders properly when it has no errors', () => {
    const html = makeField().html();
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('is-danger');
  });

  it('renders properly when it has errors', () => {
    const html = makeField({ errors: ['this cannot be blank'] }).html();
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain('is-danger');
  });
});

describe('SelectFormField', () => {
  const makeSelect = (props: Partial<ChoiceFormFieldProps> = {}) => {
    return shallow(
      <SelectFormField {...choiceFieldProps(props)} />
    );
  }

  it('renders option values', () => {
    const html = makeSelect().html();
    expect(html).toContain('<option value="BAR">Bar</option>');
  });

  it('assigns name attr', () => {
    const html = makeSelect().html();
    expect(html).toContain('name="foo"');
  });

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

describe('RadiosFormField', () => {
  const makeRadios = (props: Partial<ChoiceFormFieldProps> = {}) => {
    return shallow(
      <RadiosFormField {...choiceFieldProps(props)} />
    );
  }

  it('renders name and value attrs', () => {
    const html = makeRadios().html();
    expect(html).toContain('name="foo"');
    expect(html).toContain('value="BAR"');
  });

  it('renders properly when it has no errors', () => {
    const html = makeRadios().html();
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('is-danger');
  });

  it('renders properly when it has errors', () => {
    const html = makeRadios({ errors: ['this cannot be blank'] }).html();
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain('is-danger');
  });
});

test('toggleChoice works', () => {
  expect(toggleChoice('BOOP', true, ['HI'])).toEqual(['HI', 'BOOP']);
  expect(toggleChoice('BOOP', false, ['HI', 'BOOP'])).toEqual(['HI']);
});

describe('MultiCheckboxFormField', () => {
  const makeMultiCheckbox = (props: Partial<MultiChoiceFormFieldProps> = {}) => {
    const defaultProps: MultiChoiceFormFieldProps = {
      ...baseFieldProps<string[]>({ value: [] }),
      choices: CHOICES,
      label: 'Foo',  
    };
    return shallow(
      <MultiCheckboxFormField
        {...defaultProps}
        {...props}
      />
    );
  }

  it('toggles choice on click', () => {
    const onChange = jest.fn();
    const wrapper = makeMultiCheckbox({ onChange });
    wrapper.find('input').first().simulate('change', { target: { checked: true } });
    expect(onChange.mock.calls).toHaveLength(1);
    expect(onChange.mock.calls[0][0]).toEqual(['BAR']);
  });

  it('renders name and value attrs', () => {
    const html = makeMultiCheckbox().html();
    expect(html).toContain('name="foo"');
    expect(html).toContain('value="BAR"');
  });

  it('renders properly when it has no errors', () => {
    const html = makeMultiCheckbox().html();
    expect(html).toContain('aria-invalid="false"');
  });

  it('renders properly when it has errors', () => {
    const html = makeMultiCheckbox({ errors: ['this must be checked'] }).html();
    expect(html).toContain('aria-invalid="true"');
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

  it('renders name attr', () => {
    const html = makeCheckbox().html();
    expect(html).toContain('name="foo"');
  });

  it('renders properly when it has no errors', () => {
    const html = makeCheckbox().html();
    expect(html).toContain('aria-invalid="false"');
  });

  it('renders properly when it has errors', () => {
    const html = makeCheckbox({ errors: ['this must be checked'] }).html();
    expect(html).toContain('aria-invalid="true"');
  });
});
