import React from 'react';

import { AppTesterPal } from "../../tests/app-tester-pal";
import HPActionRoutes from '../hp-action';

describe('HP Action flow', () => {
  afterEach(AppTesterPal.cleanup);

  it('should show 311 modal', async () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/previous-attempts/311-modal',
    });
    pal.rr.getByText('311 is an important tool');
  });
});
