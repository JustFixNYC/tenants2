import React from "react";
import { BlankLandlordDetailsType } from "../../../queries/LandlordDetailsType";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { newSb } from "../../../tests/session-builder";
import { LandlordNameAddressMutation } from "../../../queries/LandlordNameAddressMutation";
import HabitabilityRoutes from "../../letter-builder/habitability/routes";

const sb = newSb().withLoggedInJustfixUser();

describe("landlord details page", () => {
  it("works when user enters details", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.landlordInfo, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
    });
    pal.rr.getByText(/Landlord or property manager name/i);
    pal.rr.getByText(/Back/);
    pal.rr.getByText(/Next/);
  });

  it("redirects to next step after successful submission", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.landlordInfo, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
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
    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LandlordNameAddressMutation)
      .expect({
        name,
        primaryLine,
        city,
        state,
        zipCode,
      })
      .respondWith({
        isUndeliverable: null,
        errors: [],
        session: {
          landlordDetails: { ...BlankLandlordDetailsType, name, address },
        },
      });

    await pal.rt.waitFor(() =>
      pal.rr.getByText(
        /Select at least one date when you'll be available for repairs/i
      )
    );
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({
      landlordDetails: { ...BlankLandlordDetailsType, name, address },
    });
  });
});
