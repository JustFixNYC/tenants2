import React from 'react';
import IndexPage from '../../pages/index-page';
import { shallowWithRouter, ensureRedirect } from '../util';
import Routes from '../../routes';

describe('index page', () => {
  it('renders when logged in', () => {
    ensureRedirect(<IndexPage isLoggedIn={true} />, Routes.loc.home);
  });

  it('renders when logged out', () => {
    const { wrapper } = shallowWithRouter(<IndexPage isLoggedIn={false} />);
    expect(wrapper.html()).toContain('Get started');
  });
});
