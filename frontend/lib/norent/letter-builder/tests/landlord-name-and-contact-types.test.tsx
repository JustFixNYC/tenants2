import React from "react";

import { AppTesterPal } from "../../../tests/app-tester-pal";
import { BlankLandlordDetailsType } from "../../../queries/LandlordDetailsType";
import { newSb } from "../../../tests/session-builder";
import { RecommendedLocLandlord } from "../../../queries/RecommendedLocLandlord";
import { waitFor } from "@testing-library/dom";
import { NorentLetterBuilderRoutes } from "../routes";
import { NorentRoutes } from "../../route-info";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";

beforeAll(initNationalMetadataForTesting);

const sb = newSb().withLoggedInJustfixUser();

const LOOKED_UP_LANDLORD_DETAILS = {
  ...BlankLandlordDetailsType,
  name: "BOBBY DENVER",
  primaryLine: "123 DOOMBRINGER STREET 4",
  isLookedUp: true,
};

async function mockRecommendation(
  pal: AppTesterPal,
  options: { landlord?: boolean } = {}
) {
  pal.withQuery(RecommendedLocLandlord).respondWith({
    recommendedLocLandlord: options.landlord
      ? {
          name: LOOKED_UP_LANDLORD_DETAILS.name,
          primaryLine: LOOKED_UP_LANDLORD_DETAILS.primaryLine,
          city: "New York",
          state: "NY",
          zipCode: "11299",
        }
      : null,
  });
  await waitFor(() => pal.rr.getByText("Next"));
}

describe("landlord name and contact types page", () => {
  it("works when details are not looked up", async () => {
    const pal = new AppTesterPal(<NorentLetterBuilderRoutes />, {
      url: NorentRoutes.locale.letter.landlordName,
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
    });
    await mockRecommendation(pal);
    pal.rr.getByText(/Landlord\/management company's name/i);
    pal.rr.getByText(/Back/);
  });

  it("works when details are looked up", async () => {
    const pal = new AppTesterPal(<NorentLetterBuilderRoutes />, {
      url: NorentRoutes.locale.letter.landlordName,
      session: sb.with({
        landlordDetails: LOOKED_UP_LANDLORD_DETAILS,
      }).value,
    });
    await mockRecommendation(pal, { landlord: true });
    pal.rr.getByText(/\(HPD\)/i);
    pal.rr.getByText(/Back/);
  });
});
