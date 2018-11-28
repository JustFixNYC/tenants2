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

  it('should show landlord page', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/your-landlord'
    });
    pal.rr.getByText('Your landlord');
  });

  it('should show preview page', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/preview'
    });
    pal.rr.getByText('TODO: Implement this!');
  });
});
