import React from "react";
import JustfixRoutes from "../../justfix-route-info";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { newSb } from "../../tests/session-builder";
import { AccountSettingsRoutes } from "../routes";

const sb = newSb();

describe("AccountSettingsRoutes", () => {
  const makePal = () =>
    new AppTesterPal(
      <AccountSettingsRoutes routes={JustfixRoutes.locale.accountSettings} />,
      {
        url: JustfixRoutes.locale.accountSettings.home,
        session: sb.withLoggedInJustfixUser().value,
      }
    );

  it("Can edit name", () => {
    const pal = makePal();
    pal.rr.findByText("Boop Jones");
    pal.rr.getByLabelText(/edit name/i).click();
    pal.fillFormFields([
      ["First name", "Spike"],
      ["Last name", "Jonze"],
    ]);
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
});
