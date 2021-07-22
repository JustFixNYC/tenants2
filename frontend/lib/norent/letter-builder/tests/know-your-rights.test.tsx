import { AppTesterPal } from "../../../tests/app-tester-pal";
import {
  NorentLbKnowYourRights,
  hasUserSeenRttcCheckboxYet,
} from "../know-your-rights";
import { override } from "../../../tests/util";
import { BlankOnboardingScaffolding } from "../../../queries/OnboardingScaffolding";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";
import { newSb } from "../../../tests/session-builder";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";

beforeAll(initNationalMetadataForTesting);

describe("<NorentLbKnowYourRights>", () => {
  const createPal = (state: string) => {
    return new AppTesterPal(createProgressStepJSX(NorentLbKnowYourRights), {
      session: {
        onboardingScaffolding: override(BlankOnboardingScaffolding, {
          state,
        }),
      },
    });
  };

  it("shows KYR info for states w/ protections", () => {
    const pal = createPal("CA");
    pal.rr.getByText(/support once you’ve sent your letter/i);
  });

  it("dissuades user for states w/o protections", () => {
    const pal = createPal("GA");
    pal.rr.getByText(/unfortunately.+we do not currently recommend/i);
  });

  it("asks users to go to previous step if they have no state set", () => {
    const pal = createPal("");
    pal.rr.getByText(/go back and choose a state/i);
  });

  it("defaults RTTC checkbox to checked", () => {
    const pal = createPal("CA");
    const checkbox = pal.rr.getByLabelText(
      /contact me to provide/
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});

describe("hasUserSeenRttcCheckboxYet", () => {
  it("returns false", () => {
    expect(hasUserSeenRttcCheckboxYet(newSb().value)).toBe(false);
  });

  it("returns true", () => {
    for (let canReceiveRttcComms of [true, false]) {
      expect(
        hasUserSeenRttcCheckboxYet(
          newSb().withOnboardingScaffolding({ canReceiveRttcComms }).value
        )
      ).toBe(true);

      expect(
        hasUserSeenRttcCheckboxYet(
          newSb().withOnboardingInfo({ canReceiveRttcComms }).value
        )
      ).toBe(true);
    }
  });
});
