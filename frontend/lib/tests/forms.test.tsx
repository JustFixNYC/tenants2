import React from 'react';
import { FormSubmitter, Form, TextualFormField, BaseFormProps, TextualFormFieldProps, BooleanFormFieldProps, CheckboxFormField, ChoiceFormFieldProps, SelectFormField, BaseFormFieldProps } from '../forms';
import { createTestGraphQlClient } from './util';
import { shallow, mount } from 'enzyme';
import { MemoryRouter, Route, Switch } from 'react-router';
import { ServerFormFieldError, FormErrors } from '../form-errors';

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

type MyFormOutput = {
  errors: ServerFormFieldError[],
  session: string
};

type MyFormInput = {
  phoneNumber: string,
  password: string
};

const myInitialState: MyFormInput = { phoneNumber: '', password: '' };

describe('FormSubmitter', () => {
  const payload: MyFormInput = { phoneNumber: '1', password: '2' };

  const buildForm = () => {
    const { client } = createTestGraphQlClient();
    const onSuccess = jest.fn();

    const wrapper = shallow(
      <FormSubmitter
        onSubmit={(input: MyFormInput) => client.fetch('blah', { input }).then(r => r.login) }
        onSuccess={(output: MyFormOutput) => { onSuccess(output); }}
        initialState={myInitialState}
      >
        {(ctx) => <br/>}
      </FormSubmitter>
    );
    const form = wrapper.instance() as FormSubmitter<MyFormInput, MyFormOutput>;
    return { form, client, onSuccess };
  };

  it('optionally redirects when successful', async () => {
    const promise = Promise.resolve({ errors: [] });
    const wrapper = mount(
      <MemoryRouter>
        <Switch>
          <Route path="/blah" exact><p>This is blah.</p></Route>
          <Route>
            <FormSubmitter
              onSubmit={() => promise}
              onSuccess={() => {}}
              onSuccessRedirect="/blah"
              initialState={myInitialState}
              children={(ctx) => <p>This is the form.</p>} />
          </Route>
        </Switch>
      </MemoryRouter>
    );
    wrapper.find('form').simulate('submit');
    await promise;
    expect(wrapper.html()).toBe('<p>This is blah.</p>');
  });

  it('sets state when successful', async () => {
    const { form, client, onSuccess } = buildForm();
    const login = form.handleSubmit(payload);

    expect(form.state.isLoading).toBe(true);
    client.getRequestQueue()[0].resolve({
      login: {
        errors: [],
        session: 'blehhh'
      }
    });
    await login;
    expect(form.state.isLoading).toBe(false);
    expect(onSuccess.mock.calls).toHaveLength(1);
    expect(onSuccess.mock.calls[0][0]).toEqual({ errors: [], session: 'blehhh' });
  });

  it('sets state when validation errors occur', async () => {
    const { form, client, onSuccess } = buildForm();
    const login = form.handleSubmit(payload);

    expect(form.state.isLoading).toBe(true);
    client.getRequestQueue()[0].resolve({
      login: {
        errors: [{
          field: '__all__',
          messages: ['nope.']
        }]
      }
    });
    await login;
    expect(form.state.isLoading).toBe(false);
    expect(form.state.errors).toEqual({
      nonFieldErrors: ['nope.'],
      fieldErrors: {}
    });
    expect(onSuccess.mock.calls).toHaveLength(0);
  });

  it('sets state when network error occurs', async () => {
    const { form, client, onSuccess } = buildForm();
    const login = form.handleSubmit(payload);

    client.getRequestQueue()[0].reject(new Error('kaboom'));
    await login;
    expect(form.state.isLoading).toBe(false);
    expect(onSuccess.mock.calls).toHaveLength(0);
  });
});

describe('Form', () => {
  type MyFormProps = {
    onSubmit: (input: MyFormInput) => void
  } & BaseFormProps<MyFormInput>;

  function MyForm(props: MyFormProps): JSX.Element {
    return (
      <Form {...props} initialState={myInitialState}>
        {(ctx) => (
          <React.Fragment>
            <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
            <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
          </React.Fragment>
        )}
      </Form>
    );
  }

  it('submits field values', () => {
    const mockSubmit = jest.fn();
    const form = mount(<MyForm onSubmit={mockSubmit} isLoading={false} />);
    form.find('input[name="phoneNumber"]').simulate('change', { target: { value: '5551234567' } });
    form.find('input[name="password"]').simulate('change', { target: { value: 'test123' } });
    form.simulate('submit');
    expect(mockSubmit.mock.calls.length).toBe(1);
    expect(mockSubmit.mock.calls[0][0]).toEqual({
      phoneNumber: '5551234567',
      password: 'test123'
    });
  });

  it('renders field and non-field errors', () => {
    const errors: FormErrors<MyFormInput> = {
      nonFieldErrors: ['foo'],
      fieldErrors: {
        phoneNumber: ['bar']
      }
    };
    const form = mount(<MyForm onSubmit={jest.fn()} errors={errors} isLoading={false} />);
    const html = form.html();
    expect(html).toContain('foo');
    expect(html).toContain('bar');
  });

  it('does not trigger submissions when already loading', () => {
    const mockSubmit = jest.fn();
    const form = mount(<MyForm onSubmit={mockSubmit} isLoading={true} />);
    form.simulate('submit');
    expect(mockSubmit.mock.calls.length).toBe(0);
  });
});
