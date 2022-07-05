import { BlankAllSessionInfo, AllSessionInfo } from "../queries/AllSessionInfo";
import { override } from "./util";
import {
  OnboardingScaffolding,
  BlankOnboardingScaffolding,
} from "../queries/OnboardingScaffolding";
import { BlankOnboardingInfo, OnboardingInfo } from "../queries/OnboardingInfo";
import {
  PhoneNumberAccountStatus,
  Borough,
  CustomIssueArea,
  HabitabilityLetterMailChoice,
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
import {
  BlankHardshipDeclarationDetails,
  HardshipDeclarationDetails,
} from "../queries/HardshipDeclarationDetails";

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

  withOnboardingScaffolding(
    scf: Partial<OnboardingScaffolding>
  ): SessionBuilder {
    return new SessionBuilder({
      ...this.value,
      onboardingScaffolding: override(
        this.value.onboardingScaffolding || BlankOnboardingScaffolding,
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
      fullMailingAddress: "150 Court St\nBrooklyn, NY 11201",
      agreedToJustfixTerms: true,
    });
  }

  withLoggedInEvictionFreeUser(): SessionBuilder {
    return this.withLoggedInJustfixUser().withOnboardingInfo({
      agreedToJustfixTerms: false,
      agreedToEvictionfreeTerms: true,
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
    return this.withLoggedInLosAngelesUser();
  }

  withLoggedInLosAngelesUser(): SessionBuilder {
    return this.withLoggedInUser().withOnboardingInfo({
      address: "152 W. 32nd St",
      city: "Los Angeles",
      state: "CA",
      zipcode: "90007",
      canReceiveRttcComms: true,
      agreedToNorentTerms: true,
      canReceiveSajeComms: true,
      isInLosAngeles: true,
    });
  }

  withLoggedInSanFranciscoUser(): SessionBuilder {
    return this.withLoggedInUser().withOnboardingInfo({
      address: "1 Dr Carlton B Goodlett Pl",
      city: "San Francisco",
      state: "CA",
      zipcode: "94102",
      canReceiveRttcComms: true,
      agreedToNorentTerms: true,
      isInLosAngeles: false,
    });
  }

  withLoggedInNewJerseyUser(): SessionBuilder {
    return this.withLoggedInUser().withOnboardingInfo({
      address: "319 E State St",
      city: "Trenton",
      state: "NJ",
      zipcode: "08608",
      canReceiveRttcComms: true,
      agreedToNorentTerms: true,
    });
  }

  withMailedNorentLetter(): SessionBuilder {
    return this.with({
      norentLatestLetter: {
        trackingNumber: "1234",
        letterSentAt: "2020-03-13T19:41:09+00:00",
        createdAt: "2020-03-13T19:41:09+00:00",
      },
    });
  }

  withMailedHabitabilityLetter(): SessionBuilder {
    return this.with({
      habitabilityLatestLetter: {
        id: "1",
        trackingNumber: "1234",
        letterSentAt: "2020-03-13T19:41:09+00:00",
        createdAt: "2020-03-13T19:41:09+00:00",
        fullyProcessedAt: "2020-03-13T19:41:09+00:00",
        mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
        emailToLandlord: false,
      },
      habitabilityLetters: [
        {
          id: "1",
          trackingNumber: "1234",
          letterSentAt: "2020-03-13T19:41:09+00:00",
          createdAt: "2020-03-13T19:41:09+00:00",
          fullyProcessedAt: "2020-03-13T19:41:09+00:00",
          mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
          emailToLandlord: false,
        },
      ],
      hasHabitabilityLetterInProgress: true,
    });
  }

  withHabitabilityLetterInProgress(): SessionBuilder {
    return this.with({
      habitabilityLatestLetter: {
        id: "1",
        trackingNumber: "",
        letterSentAt: "",
        createdAt: "2020-03-13T19:41:09+00:00",
        fullyProcessedAt: "",
        mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
        emailToLandlord: false,
      },
      hasHabitabilityLetterInProgress: true,
    });
  }

  withHardshipDeclarationDetails(
    hdd: Partial<HardshipDeclarationDetails> = {}
  ): SessionBuilder {
    return this.with({
      hardshipDeclarationDetails: {
        ...(this.value.hardshipDeclarationDetails ??
          BlankHardshipDeclarationDetails),
        ...hdd,
      },
    });
  }

  withSubmittedHardshipDeclaration(): SessionBuilder {
    return this.with({
      submittedHardshipDeclaration: {
        createdAt: "2021-01-27",
        mailedAt: "2021-01-27",
        emailedAt: "2021-01-27",
        emailedToHousingCourtAt: "2021-01-27",
        emailedToUserAt: "2021-01-27",
        trackingNumber: "12345",
      },
    });
  }

  withAvailableNoRentPeriods(
    dates: GraphQLDate[] = ["2020-05-01"]
  ): SessionBuilder {
    return this.with({
      norentAvailableRentPeriods: dates.map((paymentDate) => ({ paymentDate })),
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
