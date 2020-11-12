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

const landlordInfo: LandlordDetailsType = {
  ...BlankLandlordDetailsType,
  name: "Landlordo Calrissian",
  address: "1 Cloud City",
};

const manualLandlordInfo: LandlordDetailsType = {
  ...BlankLandlordDetailsType,
  name: "My Manual Landlord",
  address: "My Manual Address",
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
      session: {
        landlordDetails: { ...manualLandlordInfo, isLookedUp: false },
        managementCompanyDetails: {
          name: "My manual management company",
          primaryLine: "blarg",
          city: "Beanville",
          state: "CA",
          zipCode: "91234",
        },
      },
    });
    await mockRecommendation(pal, { landlord: true });
    const llInput = pal.rr.getByLabelText("Landlord name") as HTMLInputElement;
    expect(llInput.value).toBe("My Manual Landlord");
    const mcInput = pal.rr.getByLabelText(
      "Management company name"
    ) as HTMLInputElement;
    expect(mcInput.value).toBe("My manual management company");
  });

  it("allows user to override recommendation w/ manually-entered address", async () => {
    const pal = new AppTesterPal(makeRoute(), { url: "/?force=manual" });
    await mockRecommendation(pal, { landlord: true });
    pal.rr.getByText(/You have chosen to ignore the landlord recommended/i);
    const input = pal.rr.getByLabelText("Landlord name") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("shows newest recommended landlord instead of stale one", async () => {
    const pal = new AppTesterPal(makeRoute(), {
      session: {
        landlordDetails: {
          ...landlordInfo,
          name: "STALE LANDLORD BEFORE LANDLORDO",
          isLookedUp: true,
        },
      },
    });
    await mockRecommendation(pal, { landlord: true, mgmtCo: true });
    pal.rr.getByText("Landlordo Calrissian");
    pal.rr.getByText("Cloud City Management");
  });
});
