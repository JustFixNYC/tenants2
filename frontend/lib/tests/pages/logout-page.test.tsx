import React from 'react';
import { shallowWithRouter } from '../util';
import LogoutPage from '../../pages/logout-page';

describe('logout page', () => {
  const props = {
    isLoggedIn: false,
    logoutLoading: false,
    onLogout: jest.fn()
  };
  it('renders when logged out', () => {
    const { wrapper } = shallowWithRouter(<LogoutPage {...props} isLoggedIn={false} />);
    expect(wrapper.html()).toContain('You are now signed out.');
  });
  it('renders when logged in', () => {
    const { wrapper } = shallowWithRouter(<LogoutPage {...props} isLoggedIn={true} />);
    expect(wrapper.html()).toContain('Are you sure you want to sign out?');
  });
});
