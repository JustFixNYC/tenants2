import React from 'react';
import LetterOfComplaintRoutes, { letterOfComplaintSteps, RedirectToLatestLetterOfComplaintStep } from '../letter-of-complaint';
import { AppTesterPal } from './app-tester-pal';
import { getLatestStep } from '../progress-redirection';
import { FakeSessionInfo, ensureRedirect } from './util';
import Routes from '../routes';

describe("letter of complaint steps", () => {
  afterEach(AppTesterPal.cleanup);

  letterOfComplaintSteps.forEach(step => {
    it(`${step.path} renders without throwing`, () => {
      new AppTesterPal(<LetterOfComplaintRoutes />, {
        url: step.path
      });
    });
  });
});

describe('latest step redirector', () => {
  it('returns welcome page by default', () => {
    expect(getLatestStep(FakeSessionInfo, letterOfComplaintSteps))
      .toBe(Routes.loc.home);
  });

  it('returns confirmation page if letter request has been submitted', () => {
    expect(getLatestStep({
      ...FakeSessionInfo,
      letterRequest: {} as any
    }, letterOfComplaintSteps)).toBe(Routes.loc.confirmation);
  });
});

test('RedirectToLatestLetterOfComplaintStep returns a redirect', () => {
  ensureRedirect(<RedirectToLatestLetterOfComplaintStep />, '/loc/welcome');
});
