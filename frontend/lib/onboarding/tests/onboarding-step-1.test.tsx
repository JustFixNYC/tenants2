import React from "react";

import OnboardingStep1 from "../onboarding-step-1";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { OnboardingStep1V2Mutation } from "../../queries/OnboardingStep1V2Mutation";
import { createMockFetch } from "../../networking/tests/mock-fetch";
import { FakeGeoResults } from "../../tests/util";
import JustfixRoutes from "../../justfix-route-info";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { ClearAnonymousSessionMutation } from "../../queries/ClearAnonymousSessionMutation";

const PROPS = {
  routes: JustfixRoutes.locale.locOnboarding,
  toCancel: "/cancel",
  signupIntent: OnboardingInfoSignupIntent.LOC,
};

describe("onboarding step 1 page", () => {
  beforeEach(() => jest.clearAllTimers());

  it("calls onCancel when cancel is clicked (progressively enhanced experience)", () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    pal.clickButtonOrLink("Cancel");
    pal.withFormMutation(ClearAnonymousSessionMutation).expect({});
  });

  it("calls onCancel when cancel is clicked (baseline experience)", () => {
    const pal = new AppTesterPal(
      <OnboardingStep1 {...PROPS} disableProgressiveEnhancement />
    );
    pal.clickButtonOrLink("Cancel");
    pal.withFormMutation(ClearAnonymousSessionMutation).expect({});
  });

  it("has openable modals", async () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    pal.clickButtonOrLink(/Why do you need/i);
    pal.getDialogWithLabel(/Your privacy is very important/i);
    pal.clickButtonOrLink("Got it!");
  });

  it("shows signup intent label", () => {
    const pal = new AppTesterPal(
      (
        <OnboardingStep1
          {...PROPS}
          signupIntent={OnboardingInfoSignupIntent.HP}
        />
      )
    );
    pal.rr.getByText(/to get started with your HP Action/i);
  });

  it("shows initial address and borough in autocomplete field", () => {
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />, {
      session: {
        onboardingStep1: {
          firstName: "boop",
          lastName: "jones",
          preferredFirstName: "",
          aptNumber: "2",
          address: "150 DOOMBRINGER STREET",
          borough: "MANHATTAN",
        },
      },
    });
    const input = pal.rr.getAllByLabelText(/address/i)[0] as HTMLInputElement;
    expect(input.value).toEqual("150 DOOMBRINGER STREET, Manhattan");
  });

  it("uses geo autocomplete in progressively enhanced experience", async () => {
    jest.useFakeTimers();
    const fetch = createMockFetch();
    const pal = new AppTesterPal(<OnboardingStep1 {...PROPS} />);
    fetch.mockReturnJson(FakeGeoResults);
    pal.fillFormFields([
      ["Legal first name", "boop"],
      ["Legal last name", "jones"],
      ["Preferred first name (optional)", "bip"],
      [/(?<!no\s)apartment number/i, "2"],
      [/address/i, "150 cou"],
    ]);
    await fetch.resolvePromisesAndTimers();
    pal.clickListItem(/150 COURT STREET/);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(OnboardingStep1V2Mutation).expect({
      firstName: "boop",
      lastName: "jones",
      preferredFirstName: "bip",
      aptNumber: "2",
      address: "150 COURT STREET",
      borough: "MANHATTAN",
      noAptNumber: false,
    });
  });

  it("opens confirmation modal if address returned from server is different (baseline experience only)", async () => {
    jest.useRealTimers();
    const pal = new AppTesterPal(
      <OnboardingStep1 {...PROPS} disableProgressiveEnhancement />
    );
    pal.fillFormFields([
      ["Legal first name", "boop"],
      ["Legal last name", "jones"],
      ["Preferred first name (optional)", "bip"],
      [/address/i, "150 court"],
      [/(?<!no\s)apartment number/i, "2"],
    ]);
    pal.clickRadioOrCheckbox(/Brooklyn/);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(OnboardingStep1V2Mutation).respondWith({
      errors: [],
      session: {
        onboardingStep1: {
          firstName: "boop",
          lastName: "jones",
          preferredFirstName: "bip",
          address: "150 COURT STREET",
          borough: "BROOKLYN",
          aptNumber: "2",
        },
      },
    });
    await pal.rt.waitFor(() => pal.getDialogWithLabel(/Is this your address/i));
  });
});
