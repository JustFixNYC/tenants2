import React from 'react';
import LoginPage from '../../pages/login-page';
import { mountWithRouter } from '../util';

test('index page renders', () => {
  const { wrapper } = mountWithRouter(
    <LoginPage />
  );
  expect(wrapper.html()).toContain('Sign in');
});
