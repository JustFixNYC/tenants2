import React from 'react';
import LoginPage from '../../pages/login-page';
import { mountWithRouter } from '../util';
import { Route } from 'react-router';

test('login page renders', () => {
  const { wrapper } = mountWithRouter(
    <Route component={LoginPage} />
  );
  expect(wrapper.html()).toContain('Sign in');
});
