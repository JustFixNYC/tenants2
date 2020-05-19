import { BlankAllSessionInfo, AllSessionInfo } from "../queries/AllSessionInfo";
import { override } from "./util";
import {
  NorentScaffolding,
  BlankNorentScaffolding,
} from "../queries/NorentScaffolding";
import { BlankOnboardingInfo, OnboardingInfo } from "../queries/OnboardingInfo";
import { PhoneNumberAccountStatus, Borough } from "../queries/globalTypes";

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
    return this.with({
      firstName: "Boop",
      lastName: "Jones",
      phoneNumber: "5551234567",
      userId: 123,
      email: "boop@jones.net",
    });
  }

  withLoggedInJustfixUser(): SessionBuilder {
    return this.withLoggedInUser().withOnboardingInfo({
      address: "150 Court St",
      borough: Borough.BROOKLYN,
      state: "NY",
      zipcode: "11201",
      agreedToJustfixTerms: true,
    });
  }

  withLoggedInNationalUser(): SessionBuilder {
    return this.withLoggedInUser().withOnboardingInfo({
      address: "152 W. 32nd St",
      city: "Los Angeles",
      state: "CA",
      zipcode: "90007",
      agreedToNorentTerms: true,
    });
  }

  withQueriedPhoneNumber(status: PhoneNumberAccountStatus): SessionBuilder {
    return this.with({
      lastQueriedPhoneNumber: "5551234567",
      lastQueriedPhoneNumberAccountStatus: status,
    });
  }
}

/**
 * Less verbose shortcut to create a new SessionBuilder.
 */
export const newSb = (value?: AllSessionInfo) => new SessionBuilder(value);
