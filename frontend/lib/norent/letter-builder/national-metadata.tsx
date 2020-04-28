import RawStateLawForBuilder from "../../../../common-data/norent-state-law-for-builder.json";
import RawStateLawForLetter from "../../../../common-data/norent-state-law-for-letter.json";
import RawStatePartnersForBuilder from "../../../../common-data/norent-state-partners-for-builder.json";
import RawStateDocumentationRequirements from "../../../../common-data/norent-state-documentation-requirements.json";
import RawStateLegalAidProviders from "../../../../common-data/norent-state-legal-aid-providers.json";
import {
  USStateChoice,
  isUSStateChoice,
} from "../../../../common-data/us-state-choices";
import { LosAngelesZipCodes } from "../data/la-zipcodes";
import { AllSessionInfo } from "../../queries/AllSessionInfo.js";
import { useContext } from "react";
import { AppContext } from "../../app-context";

type StateLawForBuilderEntry = {
  linkToLegislation?: string;
  textOfLegislation: string;
  stateWithoutProtections: boolean;
};

export enum CovidStateLawVersion {
  V1_NON_PAYMENT = "V1 non-payment",
  V2_HARDSHIP = "V2 hardship",
  V3_FEW_PROTECTIONS = "V3 few protections",
}

type StateLawForLetterEntry = {
  whichVersion: CovidStateLawVersion;
  textOfLegislation: string[];
};

export type StatePartnerForBuilderEntry = {
  organizationName?: string;
  organizationWebsiteLink?: string;
};

const DefaultStatePartnerForBuilder = {
  organizationName: "Right to the City Alliancey",
  organizationWebsiteLink: "https://cancelrent.us/",
};

type StateDocumentationRequirementsEntry = {
  doesTheTenantNeedToSendTheDocumentationToTheLandlord: boolean;
  isDocumentationALegalRequirement: boolean;
  numberOfDaysFromNonPaymentNoticeToProvideDocumentation?: number;
};

type StateLegalAidProviderEntry = {
  localLegalAidProviderLink: string;
};

type StateMapping<T> = {
  [k in USStateChoice]: T;
};

const StateLawForBuilder = RawStateLawForBuilder as StateMapping<
  StateLawForBuilderEntry
>;
const StateLawForLetter = RawStateLawForLetter as StateMapping<
  StateLawForLetterEntry
>;
const StatePartnersForBuilder = RawStatePartnersForBuilder as StateMapping<
  StatePartnerForBuilderEntry
>;
const StateDocumentationRequirements = RawStateDocumentationRequirements as StateMapping<
  StateDocumentationRequirementsEntry
>;
const StateLegalAidProviders = RawStateLegalAidProviders as StateMapping<
  StateLegalAidProviderEntry
>;

/**
 * Return the given string as a U.S. state choice, throwing an
 * error if it's invalid.
 */
export const assertIsUSState = (state: string): USStateChoice => {
  if (!isUSStateChoice(state)) {
    throw new Error(`${state} is not a valid two-letter US state!`);
  }
  return state;
};

export type NorentMetadataForUSState = ReturnType<
  typeof getNorentMetadataForUSState
>;

/**
 * Return a big blob of metadata about NoRent.org-related information
 * for the given U.S. state.
 */
export const getNorentMetadataForUSState = (state: USStateChoice) => {
  return {
    lawForBuilder: StateLawForBuilder[state],
    lawForLetter: StateLawForLetter[state],
    partner: StatePartnersForBuilder[state] || DefaultStatePartnerForBuilder,
    docs: StateDocumentationRequirements[state],
    legalAid: StateLegalAidProviders[state],
  };
};

/**
 * Return a boolean determining whether a given zipcode is within
 * our array of Los Angeles County zipcodes.
 */
export const isZipCodeInLosAngeles = (zipCode: string) => {
  return LosAngelesZipCodes.includes(zipCode);
};

function isInStateWithProtections(state: string | null | undefined): boolean {
  // This is kind of arbitrary, it shouldn't ever happen, but we want
  // to return a boolean and very few states have no protections so
  // we're just going to return true.
  if (!state) return true;

  return !getNorentMetadataForUSState(assertIsUSState(state)).lawForBuilder
    .stateWithoutProtections;
}

export function useIsOnboardingUserInStateWithProtections(): boolean {
  const s = useContext(AppContext).session;
  return isInStateWithProtections(s.norentScaffolding?.state);
}

export function isOnboardingUserInStateWithProtections(
  s: AllSessionInfo
): boolean {
  return isInStateWithProtections(s.norentScaffolding?.state);
}

export function isLoggedInUserInStateWithProtections(
  s: AllSessionInfo
): boolean {
  return isInStateWithProtections(s.onboardingInfo?.state);
}
