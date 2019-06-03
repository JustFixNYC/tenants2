import React from 'react';
import IndexPage from '../../pages/index-page';
import Routes from '../../routes';
import { AppTesterPal } from '../app-tester-pal';
import { Route } from 'react-router';

describe('index page', () => {
  afterEach(AppTesterPal.cleanup);

  it('renders when logged in', () => {
    const pal = new AppTesterPal(<Route path="/" exact render={() =>
      <IndexPage isLoggedIn={true} />
    } />);
    expect(pal.history.location.pathname).toBe(Routes.locale.loc.latestStep);
  });

  it('renders when logged out', () => {
    const pal = new AppTesterPal(<IndexPage isLoggedIn={false} />);
    expect(pal.rr.container.innerHTML).toContain('Is your landlord not responding');
  });
});
