import React from 'react';

import ReactTestingLibraryPal from "./rtl-pal";
import { AppTesterPal } from "./app-tester-pal";
import DevRoutes from "../dev";

describe("development tools home", () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('works', () => {
    const pal = new AppTesterPal(<DevRoutes/>, {
      url: '/dev'
    });
    pal.clickButtonOrLink(/examples\/loading-page/);
  });
});
