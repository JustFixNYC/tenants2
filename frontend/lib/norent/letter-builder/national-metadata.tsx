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

type StateLawForBuilderEntry = {
  linkToLegislation: string;
  textOfLegislation: string;
};

type StateLawForLetterEntry = {
  textOfLegislation1: string;
  textOfLegislation2?: string;
  textOfLegislation3?: string;
  textOfLegislation4?: string;
  textOfLegislation5?: string;
  textOfLegislation6?: string;
};

type StatePartnerForBuilderEntry = {
  organizationName: string;
  organizationWebsiteLink: string;
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

/**
 * Return a big blob of metadata about NoRent.org-related information
 * for the given U.S. state.
 */
export const getNorentMetadataForUSState = (state: USStateChoice) => {
  return {
    lawForBuilder: StateLawForBuilder[state],
    lawForLetter: StateLawForLetter[state],
    partner: StatePartnersForBuilder[state],
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
