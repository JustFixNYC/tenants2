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
import { RecommendedHpLandlord } from "../../queries/RecommendedHpLandlord";
import { waitFor } from "@testing-library/dom";

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

  it("shows dynamic address when user is NYCHA", () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: {
        onboardingInfo: {
          ...BlankOnboardingInfo,
          leaseType: LeaseType.NYCHA,
        },
      },
    });
    pal.getElement("div", ".jf-loader");
  });

  it("shows manually-entered address in form fields", () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: false } },
    });
    const input = pal.rr.getByLabelText("Landlord name") as HTMLInputElement;
    expect(input.value).toBe("Landlordo Calrissian");
  });

  it("shows automatically looked-up address as read-only", async () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: true } },
    });
    pal.withQuery(RecommendedHpLandlord).respondWith({
      recommendedHpLandlord: {
        name: landlordInfo.name,
        primaryLine: landlordInfo.address,
        city: "Bespin",
        state: "OH",
        zipCode: "43220",
      },
      recommendedHpManagementCompany: {
        name: "Cloud City Management",
        primaryLine: "1 Managerial Way",
        city: "Bespin",
        state: "OH",
        zipCode: "43221",
      },
    });
    await waitFor(() => pal.rr.getByText("Cloud City Management"));
  });
});
