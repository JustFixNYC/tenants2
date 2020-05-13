import { BlankAllSessionInfo, AllSessionInfo } from "../queries/AllSessionInfo";
import { override } from "./util";
import {
  NorentScaffolding,
  BlankNorentScaffolding,
} from "../queries/NorentScaffolding";
import { BlankOnboardingInfo, OnboardingInfo } from "../queries/OnboardingInfo";

/**
 * An attempt to encapsulate the creation of a GraphQL session object
 * in a Builder pattern:
 *
 *   https://en.wikipedia.org/wiki/Builder_pattern
 */
export class SessionBuilder {
  constructor(readonly value: AllSessionInfo = BlankAllSessionInfo) {}

  with(s: Partial<AllSessionInfo>): SessionBuilder {
    return new SessionBuilder(override(this.value, s));
  }

  withNorentScaffolding(scf: Partial<NorentScaffolding>): SessionBuilder {
    return new SessionBuilder({
      ...this.value,
      norentScaffolding: override(
        this.value.norentScaffolding || BlankNorentScaffolding,
        scf
      ),
    });
  }

  withOnboardingInfo(onb: Partial<OnboardingInfo>): SessionBuilder {
    return new SessionBuilder({
      ...this.value,
      onboardingInfo: override(
        this.value.onboardingInfo || BlankOnboardingInfo,
        onb
      ),
    });
  }

  withLoggedInUser(): SessionBuilder {
    return new SessionBuilder(
      override(this.value, {
        firstName: "Boop",
        lastName: "Jones",
        phoneNumber: "5551234567",
        userId: 123,
      })
    );
  }
}

/**
 * Less verbose shortcut to create a new SessionBuilder.
 */
export const newSb = (value?: AllSessionInfo) => new SessionBuilder(value);
