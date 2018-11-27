import React from 'react';

import { AppTesterPal } from "./app-tester-pal";
import HPActionRoutes from '../hp-action';

describe('HP Action flow', () => {
  afterEach(AppTesterPal.cleanup);

  it('should show pre-onboarding page', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp'
    });
    pal.rr.getByText('HP action landing page');
  });

  it('should show post-onboarding page', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/welcome'
    });
    pal.rr.getByText('Start my case');
  });

  it('should show issues checklist', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/issues'
    });
    pal.rr.getByText('Bathrooms');
  });
});
