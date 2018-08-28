import React from 'react';
import LoginPage from '../../pages/login-page';
import { shallowWithRouter } from '../util';

test('index page renders', () => {
  const { wrapper } = shallowWithRouter(
    <LoginPage fetch={null as any} onSuccess={null as any} />
  );
  expect(wrapper.html()).toContain('Sign in');
});
