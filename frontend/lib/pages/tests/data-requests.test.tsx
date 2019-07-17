import React from 'react';
import { AppTesterPal } from "../../tests/app-tester-pal";
import DataRequestsRoutes from "../data-requests";
import Routes from '../../routes';

describe('Data requests', () => {
  afterEach(AppTesterPal.cleanup);

  it('should work', () => {
    const pal = new AppTesterPal(<DataRequestsRoutes/>, {
      url: Routes.locale.dataRequests.multiLandlord
    });
    pal.rr.getByLabelText(/landlords/i);
  });
});
