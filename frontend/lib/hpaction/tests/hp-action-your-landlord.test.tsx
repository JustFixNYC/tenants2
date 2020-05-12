import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { HPActionYourLandlord } from "../hp-action-your-landlord";
import { Route } from "react-router-dom";
import { BlankOnboardingInfo } from "../../queries/OnboardingInfo";
import { LeaseType } from "../../queries/globalTypes";
import {
  BlankLandlordDetailsType,
  LandlordDetailsType,
} from "../../queries/LandlordDetailsType";

describe("HPActionYourLandlord", () => {
  

  const landlordInfo: LandlordDetailsType = {
    ...BlankLandlordDetailsType,
    name: "Landlordo Calrissian",
    address: "1 Cloud City",
  };

  const makeRoute = () => (
    <Route
      render={(props) => (
        <HPActionYourLandlord nextStep="/next" prevStep="/prev" {...props} />
      )}
    />
  );

  it("shows NYCHA address when user is NYCHA", () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: {
        onboardingInfo: {
          ...BlankOnboardingInfo,
          leaseType: LeaseType.NYCHA,
        },
      },
    });
    pal.rr.getByText("NYC Housing Authority");
  });

  it("shows manually-entered address in form fields", () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: false } },
    });
    const input = pal.rr.getByLabelText("Landlord name") as HTMLInputElement;
    expect(input.value).toBe("Landlordo Calrissian");
  });

  it("shows automatically looked-up address as read-only", () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: true } },
    });
    pal.rr.getByText("Landlordo Calrissian");
  });
});
