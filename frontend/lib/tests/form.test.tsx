import React from 'react';
import { MyFormInput, myInitialState, renderMyFormFields } from "./my-form";
import { BaseFormProps, Form } from "../form";
import { mount } from "enzyme";
import { FormErrors } from "../form-errors";
import { simpleFormErrors } from "./util";

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
