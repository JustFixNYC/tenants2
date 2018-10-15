import React from 'react';
import LetterOfComplaintRoutes, { letterOfComplaintSteps } from '../letter-of-complaint';
import { AppTesterPal } from './app-tester-pal';

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
