import React from 'react';

import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { AppTesterPal } from "../../tests/app-tester-pal";
import DevRoutes from "../dev";
import Routes from '../../routes';

describe("development pages", () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('shows development tools home', () => {
    const pal = new AppTesterPal(<DevRoutes/>, {
      url: '/dev'
    });
    pal.clickButtonOrLink(/examples\/loading-page/);
  });

  it('shows DDO dev page', () => {
    const pal = new AppTesterPal(<DevRoutes/>, {url: Routes.dev.examples.ddo});
    pal.rr.getByText('Submit');
  });
});
