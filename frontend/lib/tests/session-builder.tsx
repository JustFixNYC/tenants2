import { BlankAllSessionInfo, AllSessionInfo } from "../queries/AllSessionInfo";
import { override } from "./util";
import {
  NorentScaffolding,
  BlankNorentScaffolding,
} from "../queries/NorentScaffolding";
import { BlankOnboardingInfo, OnboardingInfo } from "../queries/OnboardingInfo";
import {
  PhoneNumberAccountStatus,
  Borough,
  CustomIssueArea,
} from "../queries/globalTypes";
import { IssueChoice } from "../../../common-data/issue-choices";
import { IssueAreaChoice } from "../../../common-data/issue-area-choices";
import {
  HarassmentDetails,
  BlankHarassmentDetails,
} from "../queries/HarassmentDetails";
import {
  HPActionDetails,
  BlankHPActionDetails,
} from "../queries/HPActionDetails";

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

  withHarassmentDetails(hd?: Partial<HarassmentDetails>): SessionBuilder {
    return new SessionBuilder({
      ...this.value,
      harassmentDetails: override(
        this.value.harassmentDetails || BlankHarassmentDetails,
        hd || {}
      ),
    });
  }

  withHpActionDetails(hp?: Partial<HPActionDetails>): SessionBuilder {
    return new SessionBuilder({
      ...this.value,
      hpActionDetails: override(
        this.value.hpActionDetails || BlankHPActionDetails,
        hp || {}
      ),
    });
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
      city: "Brooklyn",
      state: "NY",
      zipcode: "11201",
      agreedToJustfixTerms: true,
    });
  }

  withIssues(issues: IssueChoice[] = ["HOME__RATS"]): SessionBuilder {
    return this.with({ issues });
  }

  withCustomIssue(
    area: IssueAreaChoice = "HOME",
    description: string = "Rain enters through roof"
  ): SessionBuilder {
    const prevIssues = this.value.customIssuesV2 || [];
    return this.with({
      customIssuesV2: [
        ...prevIssues,
        { area: area as CustomIssueArea, description, id: area + description },
      ],
    });
  }

  withLandlordDetails(): SessionBuilder {
    return this.with({
      landlordDetails: {
        name: "Landlordo Calrissian",
        address: "123 Cloud City Drive\nBespin, NY 12345",
        primaryLine: "123 Cloud City Drive",
        city: "Bespin",
        state: "NY",
        zipCode: "12345",
        email: "landlordo@calrissian.net",
        phoneNumber: "5551234567",
        isLookedUp: false,
      },
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
