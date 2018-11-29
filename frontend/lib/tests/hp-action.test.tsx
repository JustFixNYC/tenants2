import React from 'react';

import { AppTesterPal } from "./app-tester-pal";
import HPActionRoutes, { HPActionProgressRoutesProps } from '../hp-action';
import { ProgressRoutesTester } from './progress-routes-tester';
import Routes from '../routes';

const tester = new ProgressRoutesTester(HPActionProgressRoutesProps, 'HP Action');

tester.defineSmokeTests();

describe('HP Action flow', () => {
  afterEach(AppTesterPal.cleanup);

  it('should show PDF download link on confirmation page', () => {
    const pal = new AppTesterPal(<HPActionRoutes />, {
      url: '/hp/confirmation',
      session: {
        latestHpActionPdfUrl: '/boop.pdf'
      }
    });
    const a = pal.rr.getByText(/download/i);
    expect(a.getAttribute('href')).toBe('/boop.pdf');
  });
});

describe('latest step redirector', () => {
  it('returns splash page when user is not logged-in', () => {
    expect(tester.getLatestStep()).toBe(Routes.hp.splash);
  });

  it('returns welcome page when user is logged-in', () => {
    expect(tester.getLatestStep({ phoneNumber: '123' })).toBe(Routes.hp.welcome);
  });

  it('returns confirmation page when user has generated a PDF', () => {
    expect(tester.getLatestStep({ latestHpActionPdfUrl: '/boop.pdf' })).toBe(Routes.hp.confirmation);
  });
});
