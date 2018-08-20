import React from 'react';
import { mount } from 'enzyme';
import { LoginForm } from '../login-form';
import { FormErrors } from '../forms';
import { LoginInput } from '../queries/globalTypes';

describe('LoginForm', () => {
  it('submits field values', () => {
    const mockSubmit = jest.fn();
    const form = mount(<LoginForm onSubmit={mockSubmit} />);
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
    const errors: FormErrors<LoginInput> = {
      nonFieldErrors: ['foo'],
      fieldErrors: {
        phoneNumber: ['bar']
      }
    };
    const form = mount(<LoginForm onSubmit={jest.fn()} errors={errors} />);
    const html = form.html();
    expect(html).toContain('foo');
    expect(html).toContain('bar');
  });
});
