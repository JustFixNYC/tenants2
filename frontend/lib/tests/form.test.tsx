import React from 'react';
import { MyFormInput, myInitialState, renderMyFormFields } from "./my-form";
import { BaseFormProps, Form } from "../form";
import { FormErrors } from "../form-errors";
import { simpleFormErrors } from "./util";
import ReactTestingLibraryPal from './rtl-pal';

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

  afterEach(ReactTestingLibraryPal.cleanup);

  it('submits field values', () => {
    const mockSubmit = jest.fn();
    const pal = new ReactTestingLibraryPal(<MyForm onSubmit={mockSubmit} isLoading={false} />);
    pal.fillFormFields([
      ['Phone number', '5551234567'],
      ['Password', 'test123']
    ]);
    const wasDefaultPrevented = !pal.rt.fireEvent.submit(pal.getElement('form'));
    expect(wasDefaultPrevented).toBe(true);
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
    const pal = new ReactTestingLibraryPal(<MyForm onSubmit={jest.fn()} errors={errors} isLoading={false} />);
    const html = pal.rr.container.innerHTML;
    expect(html).toContain('foo');
    expect(html).toContain('bar');
  });

  it('does not trigger submissions when already loading', () => {
    const mockSubmit = jest.fn();
    const pal = new ReactTestingLibraryPal(<MyForm onSubmit={mockSubmit} isLoading={true} />);
    const wasDefaultPrevented = !pal.rt.fireEvent.submit(pal.getElement('form'));
    expect(wasDefaultPrevented).toBe(true);
    expect(mockSubmit.mock.calls.length).toBe(0);
  });
});
