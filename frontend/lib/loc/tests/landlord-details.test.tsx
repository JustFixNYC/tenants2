import React from "react";

import JustfixRoutes from "../../justfix-routes";
import LetterOfComplaintRoutes from "../letter-of-complaint";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { LandlordDetailsV2Input } from "../../queries/globalTypes";
import { BlankLandlordDetailsType } from "../../queries/LandlordDetailsType";
import { LandlordDetailsV2Mutation_output } from "../../queries/LandlordDetailsV2Mutation";

const LOOKED_UP_LANDLORD_DETAILS = {
  ...BlankLandlordDetailsType,
  name: "BOBBY DENVER",
  address: "123 DOOMBRINGER STREET 4\nNEW YORK 11299",
  isLookedUp: true,
};

describe("landlord details page", () => {
  afterEach(AppTesterPal.cleanup);

  it("works when details are not looked up", () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.yourLandlord,
      session: { landlordDetails: BlankLandlordDetailsType },
    });
    pal.rr.getByText(/Please enter your landlord's name/i);
    pal.rr.getByText(/Back/);
    pal.rr.getByText(/Preview letter/);
  });

  it("works when details are looked up", () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.yourLandlord,
      session: { landlordDetails: LOOKED_UP_LANDLORD_DETAILS },
    });
    pal.rr.getByText(/This may be different .+ rent checks/i);
    pal.rr.getByText(/Back/);
    pal.rr.getByText(/Preview letter/);
  });

  it("redirects to next step after successful submission", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.yourLandlord,
      session: { landlordDetails: BlankLandlordDetailsType },
    });
    const name = "Boop Jones";
    const primaryLine = "123 Boop Way";
    const city = "Boopville";
    const state = "NY";
    const zipCode = "11299";
    const address = `${primaryLine}\n${city}, ${state} ${zipCode}`;

    pal.fillFormFields([
      [/name/i, name],
      [/address/i, primaryLine],
      [/city/i, city],
      [/state/i, state],
      [/zip/i, zipCode],
    ]);
    pal.clickButtonOrLink("Preview letter");
    pal.expectFormInput<LandlordDetailsV2Input>({
      name,
      primaryLine,
      city,
      state,
      zipCode,
    });
    pal.respondWithFormOutput<LandlordDetailsV2Mutation_output>({
      errors: [],
      isUndeliverable: null,
      session: {
        landlordDetails: { ...BlankLandlordDetailsType, name, address },
      },
    });

    await pal.rt.waitForElement(() =>
      pal.rr.getByText(/Review the letter of complaint/i)
    );
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({
      landlordDetails: { ...BlankLandlordDetailsType, name, address },
    });
  });
});
