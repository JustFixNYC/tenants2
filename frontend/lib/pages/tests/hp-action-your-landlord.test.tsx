import React from 'react';
import { AppTesterPal } from "../../tests/app-tester-pal";
import { HPActionYourLandlord } from "../hp-action-your-landlord";
import { Route } from "react-router-dom";
import { BlankOnboardingInfo } from '../../queries/OnboardingInfo';
import { OnboardingInfoLeaseType } from '../../queries/globalTypes';

describe('HPActionYourLandlord', () => {
  afterEach(AppTesterPal.cleanup);

  const makeRoute = () => <Route render={
    props => <HPActionYourLandlord nextStep="/next" prevStep="/prev" {...props} />
  } />;

  it('shows NYCHA address when user is NYCHA', () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: {
        onboardingInfo: {
          ...BlankOnboardingInfo,
          leaseType: OnboardingInfoLeaseType.NYCHA,
        }
      }
    });
    pal.rr.getByText("NYC Housing Authority");
  });


});
