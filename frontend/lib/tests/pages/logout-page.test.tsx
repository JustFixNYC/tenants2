import React from 'react';
import { LogoutPage } from '../../pages/logout-page';
import { AppTesterPal } from '../app-tester-pal';

describe('logout page', () => {
  const pageWithPhoneNumber = (phoneNumber: string|null) => (
    new AppTesterPal(<LogoutPage/>, { session: { phoneNumber } })
  );

  it('renders when logged out', () => {
    pageWithPhoneNumber(null).rr.getByText(/You are now signed out/);
  });

  it('submits logout form', () => {
    const pal = pageWithPhoneNumber('5551234567')
    pal.rr.getByText(/Are you sure/);
    pal.clickButtonOrLink(/sign out/i);
    pal.expectGraphQL(/LogoutMutation/);
  });
});
