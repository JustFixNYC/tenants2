import React from 'react';
import { ProgressRoutesTester } from './progress-routes-tester';
import { getEmergencyHPActionProgressRoutesProps } from '../emergency-hp-action';
import { AppTesterPal } from './app-tester-pal';
import { ProgressRoutes } from '../progress-routes';
import Routes from '../routes';

const tester = new ProgressRoutesTester(getEmergencyHPActionProgressRoutesProps(), 'Emergency HP Action');

tester.defineSmokeTests();

describe("Review page", () => {
  afterEach(AppTesterPal.cleanup);

  it("opens signing modal", () => {
    const pal = new AppTesterPal(<ProgressRoutes {...getEmergencyHPActionProgressRoutesProps()} />, {
      url: Routes.locale.ehp.reviewForms
    });
    pal.clickButtonOrLink(/look good to me/);
    pal.getByTextAndSelector(/sign my forms/i, 'button')
  });
});
