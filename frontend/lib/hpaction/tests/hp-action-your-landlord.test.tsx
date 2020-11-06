import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import {
  HPActionYourLandlord,
  shouldUseRecommendedLandlordInfo,
} from "../hp-action-your-landlord";
import { Route } from "react-router-dom";
import { BlankOnboardingInfo } from "../../queries/OnboardingInfo";
import { LeaseType } from "../../queries/globalTypes";
import {
  BlankLandlordDetailsType,
  LandlordDetailsType,
} from "../../queries/LandlordDetailsType";
import { RecommendedHpLandlord } from "../../queries/RecommendedHpLandlord";
import { waitFor } from "@testing-library/dom";

const landlordInfo: LandlordDetailsType = {
  ...BlankLandlordDetailsType,
  name: "Landlordo Calrissian",
  address: "1 Cloud City",
};

async function mockRecommendation(
  pal: AppTesterPal,
  options: { landlord?: boolean; mgmtCo?: boolean } = {}
) {
  pal.withQuery(RecommendedHpLandlord).respondWith({
    recommendedHpLandlord: options.landlord
      ? {
          name: landlordInfo.name,
          primaryLine: landlordInfo.address,
          city: "Bespin",
          state: "OH",
          zipCode: "43220",
        }
      : null,
    recommendedHpManagementCompany: options.mgmtCo
      ? {
          name: "Cloud City Management",
          primaryLine: "1 Managerial Way",
          city: "Bespin",
          state: "OH",
          zipCode: "43221",
        }
      : null,
  });
  await waitFor(() => pal.rr.getByText("Next"));
}

describe("shouldUseRecommendedLandlordInfo()", () => {
  it("Returns true when LL is currently manually specified but user wants to force recommended", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: true,
        forceManual: false,
        forceRecommended: true,
      })
    ).toBe(true);
  });

  it("Returns false when LL is currently manually specified and user has no opinion", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: true,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(false);
  });

  it("Returns true when recommendation exists and user has no opinion", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(true);
  });

  it("Returns false when recommendation exists and user wants to force manual", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: true,
        forceRecommended: false,
      })
    ).toBe(false);
  });

  it("Returns false when no recommendation exists", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: false,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(false);
  });
});

describe("HPActionYourLandlord", () => {
  const makeRoute = () => (
    <Route
      render={(props) => (
        <HPActionYourLandlord nextStep="/next" prevStep="/prev" {...props} />
      )}
    />
  );

  it("shows dynamic address when user is NYCHA", async () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: {
        onboardingInfo: {
          ...BlankOnboardingInfo,
          leaseType: LeaseType.NYCHA,
        },
      },
    });
    await mockRecommendation(pal, { landlord: true });
    pal.rr.getByText(/you are in NYCHA housing/i);
  });

  it("shows manually-entered address in form fields", async () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: false } },
    });
    await mockRecommendation(pal);
    const input = pal.rr.getByLabelText("Landlord name") as HTMLInputElement;
    expect(input.value).toBe("Landlordo Calrissian");
  });

  it("shows automatically looked-up address as read-only", async () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: { landlordDetails: { ...landlordInfo, isLookedUp: true } },
    });
    await mockRecommendation(pal, { landlord: true, mgmtCo: true });
    pal.rr.getByText("Cloud City Management");
  });
});
