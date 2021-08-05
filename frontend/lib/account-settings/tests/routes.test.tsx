import React from "react";
import JustfixRoutes from "../../justfix-route-info";
import { LeaseType } from "../../queries/globalTypes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { newSb } from "../../tests/session-builder";
import { AccountSettingsRoutes } from "../routes";

const sb = newSb();

describe("AccountSettingsRoutes", () => {
  const makePal = (url?: string) =>
    new AppTesterPal(
      <AccountSettingsRoutes routes={JustfixRoutes.locale.accountSettings} />,
      {
        url: url || JustfixRoutes.locale.accountSettings.home,
        session: sb.withLoggedInJustfixUser().withOnboardingInfo({
          leaseType: LeaseType.RENT_STABILIZED,
        }).value,
      }
    );

  it("Can edit legal name", () => {
    const pal = makePal();
    pal.rr.findByText("Boop Jones");
    pal.rr.getByLabelText(/edit legal name/i).click();
    pal.fillFormFields([
      ["Legal first name", "Spike"],
      ["Legal last name", "Jonze"],
    ]);
    pal.clickButtonOrLink("Cancel");
  });

  it("Can edit preferred name", () => {
    const pal = makePal();
    pal.rr.findByText("Boop Jones");
    pal.rr.getByLabelText(/edit preferred first name/i).click();
    pal.fillFormFields([["Preferred first name (optional)", "Charlotte"]]);
    pal.clickButtonOrLink("Cancel");
  });

  it("Can edit phone number", () => {
    const pal = makePal();
    pal.rr.findByText("(555) 123-4567");
    pal.rr.getByLabelText(/edit phone number/i).click();
    pal.fillFormFields([["Phone number", "3144031234"]]);
    pal.clickButtonOrLink("Cancel");
  });

  it("Can edit email address", () => {
    const pal = makePal();
    pal.rr.findByText("boop@jones.net");
    pal.rr.getByLabelText(/edit email address/i).click();
    pal.fillFormFields([["Email address", "spike@jonze.net"]]);
    pal.clickButtonOrLink("Cancel");
  });

  it("Can edit mailing address", () => {
    const pal = makePal();
    pal.rr.findByText(/150 court st/i);
    pal.rr.getByLabelText(/edit your address/i).click();
    pal.fillFormFields([["Address", "654 park place"]]);
    pal.clickButtonOrLink("Cancel");
  });

  it("can confirm mailing address", () => {
    const pal = makePal(
      JustfixRoutes.locale.accountSettings.confirmAddressModal
    );
    pal.rr.findByText("Is this your address?");
    pal.clickButtonOrLink("Yes!");
  });

  it("can un-confirm mailing address", () => {
    const pal = makePal(
      JustfixRoutes.locale.accountSettings.confirmAddressModal
    );
    pal.rr.findByText("Is this your address?");
    pal.clickButtonOrLink("No, go back.");
    pal.fillFormFields([["Address", "654 park place"]]);
    pal.clickButtonOrLink("Cancel");
  });

  it("Can edit housing type", () => {
    const pal = makePal();
    pal.rr.findByText(/rent stabilized/i);
    pal.rr.getByLabelText(/edit housing type/i).click();
    pal.clickRadioOrCheckbox("Market Rate");
    pal.clickButtonOrLink("Cancel");
  });
});
