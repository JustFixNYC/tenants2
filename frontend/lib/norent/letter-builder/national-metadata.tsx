import React from "react";
import {
  USStateChoice,
  isUSStateChoice,
} from "../../../../common-data/us-state-choices";
import { LosAngelesZipCodes } from "../data/la-zipcodes";
import { AllSessionInfo } from "../../queries/AllSessionInfo.js";
import { useContext } from "react";
import { AppContext } from "../../app-context";
import loadable, { LoadableLibrary } from "@loadable/component";
import i18n, { SupportedLocale } from "../../i18n";

type StateLawForBuilderEntry = {
  linkToLegislation?: string;
  textOfLegislation?: string;
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
  organizationName: string;
  organizationWebsiteLink: string;
};

export const DefaultStatePartnerForBuilder = {
  organizationName: "Right to the City Alliance",
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

export type LocalizedNationalMetadata = {
  lawForBuilder: StateMapping<StateLawForBuilderEntry>;
  lawForLetter: StateMapping<StateLawForLetterEntry>;
  partnersForBuilder: Partial<StateMapping<StatePartnerForBuilderEntry>>;
  documentationRequirements: StateMapping<StateDocumentationRequirementsEntry>;
  legalAidProviders: StateMapping<StateLegalAidProviderEntry>;
};

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

type LoadableNationalMetadata = LoadableLibrary<{
  metadata: LocalizedNationalMetadata;
}>;

const EnNationalMetadata: LoadableNationalMetadata = loadable.lib(() =>
  import("./national-metadata-en")
);

function getLoadableForLanguage(
  locale: SupportedLocale
): LoadableNationalMetadata {
  switch (locale) {
    case "en":
      return EnNationalMetadata;
    case "es":
      // TODO: Fix this.
      return EnNationalMetadata;
  }
}

let localizedMetadata: LocalizedNationalMetadata | null = null;

export function setLocalizedNationalMetadata(value: LocalizedNationalMetadata) {
  localizedMetadata = value;
}

export const LocalizedNationalMetadataProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const LoadableMetadata = getLoadableForLanguage(i18n.locale);

  return (
    <LoadableMetadata fallback={<p>Loading localized national metadata...</p>}>
      {({ metadata }) => {
        localizedMetadata = metadata;
        return props.children;
      }}
    </LoadableMetadata>
  );
};

/**
 * Return a big blob of metadata about NoRent.org-related information
 * for the given U.S. state.
 */
export const getNorentMetadataForUSState = (state: USStateChoice) => {
  if (!localizedMetadata) {
    throw new Error("Localized national metadata has not been loaded!");
  }

  return {
    lawForBuilder: localizedMetadata.lawForBuilder[state],
    lawForLetter: localizedMetadata.lawForLetter[state],
    partner: localizedMetadata.partnersForBuilder[state],
    docs: localizedMetadata.documentationRequirements[state],
    legalAid: localizedMetadata.legalAidProviders[state],
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
