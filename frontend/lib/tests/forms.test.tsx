import React from 'react';
import { FormSubmitter, Form, BaseFormProps, FormSubmitterWithoutRouter, SessionUpdatingFormSubmitter, FormContext, BaseFormContextOptions } from '../forms';
import { createTestGraphQlClient, pause, simpleFormErrors } from './util';
import { shallow, mount } from 'enzyme';
import { MemoryRouter, Route, Switch } from 'react-router';
import { ServerFormFieldError, FormErrors } from '../form-errors';
import { TextualFormField } from '../form-fields';
import { AppTesterPal } from './app-tester-pal';
import { ProgressContextObject } from '../progress-context';

type MyFormOutput = {
  errors: ServerFormFieldError[],
  session: string
};

type MyFormInput = {
  phoneNumber: string,
  password: string
};

const myInitialState: MyFormInput = { phoneNumber: '', password: '' };

const renderMyFormFields = (ctx: FormContext<MyFormInput>) => <>
  <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
  <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
</>;

describe('SessionUpdatingFormSubmitter', () => {
  const SomeFormMutation = {
    graphQL: 'blah',
    fetch(fetchImpl: any, input: any) { return fetchImpl('blah', input); }
  };

  afterEach(AppTesterPal.cleanup);

  it('updates session and calls onSuccess if provided', async () => {
    const onSuccess = jest.fn();
    const pal = new AppTesterPal(
      <SessionUpdatingFormSubmitter
        mutation={SomeFormMutation}
        initialState={{ blarg: 1 } as any}
        onSuccess={onSuccess}
        children={(ctx) => {
          ctx.fieldPropsFor('blarg');
          return <button type="submit">submit</button>;
        }} />
    );
    pal.clickButtonOrLink('submit');
    pal.expectFormInput({ blarg: 1 });
    pal.respondWithFormOutput({
      errors: [],
      session: { csrfToken: 'boop' }
    });
    await pause(0);
    expect(pal.appContext.updateSession).toHaveBeenCalledWith({ csrfToken: 'boop' });
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe('FormSubmitter', () => {
  const payload: MyFormInput = { phoneNumber: '1', password: '2' };

  const buildForm = () => {
    const { client } = createTestGraphQlClient();
    const onSuccess = jest.fn();

    const wrapper = shallow(
      <FormSubmitterWithoutRouter
        progress={new ProgressContextObject()}
        history={null as any}
        location={null as any}
        match={null as any}
        onSubmit={(input: MyFormInput) => client.fetch('blah', { input }).then(r => r.login) }
        onSuccess={(output: MyFormOutput) => { onSuccess(output); }}
        initialState={myInitialState}
      >
        {renderMyFormFields}
      </FormSubmitterWithoutRouter>
    );
    const form = wrapper.instance() as FormSubmitterWithoutRouter<MyFormInput, MyFormOutput>;
    return { form, client, onSuccess };
  };

  it('optionally uses performRedirect() for redirection', async () => {
    const promise = Promise.resolve({ errors: [] });
    const performRedirect = jest.fn();
    const wrapper = mount(
      <MemoryRouter>
        <Switch>
          <Route>
            <FormSubmitter
              onSubmit={() => promise}
              onSuccess={() => {}}
              onSuccessRedirect="/blah"
              performRedirect={performRedirect}
              initialState={myInitialState}
              children={renderMyFormFields} />
          </Route>
        </Switch>
      </MemoryRouter>
    );
    wrapper.find('form').simulate('submit');
    await promise;
    expect(performRedirect.mock.calls).toHaveLength(1);
    expect(performRedirect.mock.calls[0][0]).toBe('/blah');
  });

  it('optionally calls onSuccess(), then redirects when successful', async () => {
    const promise = Promise.resolve({ errors: [] });
    const glob = { word: "foo" };
    const BlahPage = () => <p>This is {glob.word}.</p>;
    const wrapper = mount(
      <MemoryRouter>
        <Switch>
          <Route path="/blah" exact component={BlahPage}/>
          <Route>
            <FormSubmitter
              onSubmit={() => promise}
              onSuccess={() => { glob.word = "blah"; }}
              onSuccessRedirect="/blah"
              initialState={myInitialState}
              children={renderMyFormFields} />
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
          extendedMessages: [{ message: 'nope.', code: null }]
        }]
      }
    });
    await login;
    expect(form.state.isLoading).toBe(false);
    expect(form.state.errors).toEqual({
      nonFieldErrors: simpleFormErrors('nope.'),
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

describe('FormContext', () => {
  const currentState = {
    foo: 'hello',
    bar: 1,
    baz: [{thing: 1}]
  };
  const baseOptions: BaseFormContextOptions<typeof currentState> = {
    idPrefix: 'blarg',
    isLoading: false,
    errors: undefined,
    currentState,
    setField(field, value) {},
    namePrefix: 'hi'
  };

  describe('formsetPropsFor()', () => {
    const ctx = new FormContext(baseOptions, () => {});

    it('throws an error when not passed a formset', () => {
      expect(() => ctx.formsetPropsFor('foo')).toThrowError("invalid formset 'foo'");
    });

    it('works', () => {
      const props = ctx.formsetPropsFor('baz');
      expect(props.items).toEqual([{ thing: 1 }]);
      expect(props.errors).toBeUndefined();
      expect(props.idPrefix).toEqual('blarg');
      expect(props.isLoading).toEqual(false);
      expect(props.name).toEqual('baz');
    });
  });
});

describe('Form', () => {
  type MyFormProps = {
    onSubmit: (input: MyFormInput) => void
  } & BaseFormProps<MyFormInput>;

  function MyForm(props: MyFormProps): JSX.Element {
    return (
      <Form {...props} initialState={myInitialState}>
        {renderMyFormFields}
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
      nonFieldErrors: simpleFormErrors('foo'),
      fieldErrors: {
        phoneNumber: simpleFormErrors('bar')
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
